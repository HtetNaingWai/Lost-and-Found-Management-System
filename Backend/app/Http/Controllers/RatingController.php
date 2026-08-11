<?php

namespace App\Http\Controllers;

use App\Models\Claim;
use App\Models\User;
use App\Models\UserRating;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class RatingController extends Controller
{
    public function eligibility(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'claim_id' => ['required', 'integer', 'exists:claims,id'],
        ]);

        $claim = $this->findInteraction((int) $validated['claim_id']);
        $eligibility = $this->resolveEligibility($request->user(), $claim);

        return response()->json($eligibility);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'claim_id' => ['required', 'integer', 'exists:claims,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:500'],
            'reviewed_user_id' => ['prohibited'],
            'reviewer_id' => ['prohibited'],
        ]);

        $claim = $this->findInteraction((int) $validated['claim_id']);
        $eligibility = $this->resolveEligibility($request->user(), $claim);

        if (! $eligibility['eligible']) {
            return response()->json([
                'message' => $eligibility['reason'],
                'eligible' => false,
                'already_rated' => $eligibility['already_rated'] ?? false,
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $comment = trim(strip_tags($validated['comment'] ?? ''));

        try {
            $rating = DB::transaction(function () use ($request, $claim, $eligibility, $validated, $comment) {
                return UserRating::create([
                    'reviewer_id' => $request->user()->id,
                    'reviewed_user_id' => $eligibility['reviewed_user']['id'],
                    'community_post_id' => $claim->community_post_id,
                    'claim_id' => $claim->id,
                    'rating' => $validated['rating'],
                    'comment' => $comment !== '' ? $comment : null,
                ]);
            });
        } catch (\Throwable) {
            return response()->json([
                'message' => 'You already reviewed this return.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $rating->load(['reviewer:id,name,profile_image', 'communityPost:id,title,post_type']);
        $notification = NotificationService::createOnce(
            $rating->reviewed_user_id,
            'rating_received',
            'New review received',
            ($request->user()->name ?: 'A FindIt member').' left you a '.$rating->rating.'-star rating.',
            [
                'action' => 'rating_received',
                'rating_id' => $rating->id,
                'claim_id' => $claim->id,
                'community_post_id' => $claim->community_post_id,
                'reviewer_id' => $request->user()->id,
                'reviewed_user_id' => $rating->reviewed_user_id,
                'section' => 'profile-reviews',
            ],
            "rating_received:rating:{$rating->id}",
        );

        return response()->json([
            'message' => 'Thanks for your feedback.',
            'rating' => $this->transformRating($rating),
            'rating_summary' => $this->ratingSummary($rating->reviewed_user_id),
            'notification' => NotificationService::transform($notification),
        ], Response::HTTP_CREATED);
    }

    public function pending(Request $request): JsonResponse
    {
        if (! Schema::hasTable('user_ratings')) {
            return response()->json([
                'ratings' => [],
            ]);
        }

        $user = $request->user();

        $claims = Claim::query()
            ->with([
                'user:id,name,profile_image',
                'communityPost.user:id,name,profile_image',
                'communityPost.category:id,name',
            ])
            ->where('status', 'returned')
            ->where(function ($query) use ($user) {
                $query
                    ->where('user_id', $user->id)
                    ->orWhereHas('communityPost', fn ($postQuery) => $postQuery->where('user_id', $user->id));
            })
            ->whereDoesntHave('ratings', fn ($query) => $query->where('reviewer_id', $user->id))
            ->latest('returned_at')
            ->get();

        return response()->json([
            'ratings' => $claims
                ->map(fn (Claim $claim) => $this->transformPendingRating($user, $claim))
                ->filter()
                ->values(),
        ]);
    }

    public function publicReviews(User $user): JsonResponse
    {
        $reviews = UserRating::query()
            ->with(['reviewer:id,name,profile_image', 'communityPost:id,title,post_type'])
            ->where('reviewed_user_id', $user->id)
            ->latest()
            ->paginate(10);

        return response()->json([
            'reviews' => collect($reviews->items())->map(fn (UserRating $rating) => $this->transformRating($rating))->values(),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ],
        ]);
    }

    protected function findInteraction(int $claimId): Claim
    {
        return Claim::query()
            ->with([
                'user:id,name,profile_image',
                'communityPost.user:id,name,profile_image',
                'communityPost.category:id,name',
            ])
            ->findOrFail($claimId);
    }

    protected function resolveEligibility(User $reviewer, Claim $claim): array
    {
        if (! Schema::hasTable('user_ratings')) {
            return $this->ineligible('Rating is temporarily unavailable.');
        }

        if (! $claim->communityPost) {
            return $this->ineligible('Interaction not found.');
        }

        if ($claim->status !== 'returned') {
            return $this->ineligible('Return is not completed.');
        }

        $postOwnerId = $claim->communityPost->user_id;
        $claimantId = $claim->user_id;

        $viewerRole = null;
        $counterpartRole = null;

        if ($reviewer->id === $claimantId) {
            $reviewedUser = $claim->communityPost->user;
            $viewerRole = $claim->communityPost->post_type === 'lost' ? 'helper' : 'owner';
            $counterpartRole = $claim->communityPost->post_type === 'lost' ? 'owner' : 'finder';
        } elseif ($reviewer->id === $postOwnerId) {
            $reviewedUser = $claim->user;
            $viewerRole = $claim->communityPost->post_type === 'lost' ? 'owner' : 'finder';
            $counterpartRole = $claim->communityPost->post_type === 'lost' ? 'helper' : 'owner';
        } else {
            return $this->ineligible('You were not part of this return.');
        }

        if (! $reviewedUser || $reviewedUser->id === $reviewer->id) {
            return $this->ineligible('You cannot review yourself.');
        }

        $alreadyRated = UserRating::query()
            ->where('claim_id', $claim->id)
            ->where('reviewer_id', $reviewer->id)
            ->exists();

        return [
            'eligible' => ! $alreadyRated,
            'reason' => $alreadyRated ? 'You already reviewed this return.' : null,
            'already_rated' => $alreadyRated,
            'rating_submitted' => $alreadyRated,
            'can_rate' => ! $alreadyRated,
            'viewer_role' => $viewerRole,
            'counterpart_role' => $counterpartRole,
            'reviewed_user' => $this->transformUser($reviewedUser),
            'claim_id' => $claim->id,
            'community_post_id' => $claim->community_post_id,
            'item' => $this->transformItemContext($claim),
        ];
    }

    protected function ineligible(string $reason): array
    {
        return [
            'eligible' => false,
            'reason' => $reason,
            'already_rated' => false,
            'rating_submitted' => false,
            'can_rate' => false,
            'viewer_role' => null,
            'counterpart_role' => null,
            'reviewed_user' => null,
            'item' => null,
        ];
    }

    protected function ratingSummary(int $userId): array
    {
        if (! Schema::hasTable('user_ratings')) {
            return [
                'average' => null,
                'count' => 0,
            ];
        }

        $aggregate = UserRating::query()
            ->where('reviewed_user_id', $userId)
            ->selectRaw('COUNT(*) as review_count, AVG(rating) as rating_average')
            ->first();

        $count = (int) ($aggregate->review_count ?? 0);

        return [
            'average' => $count > 0 ? round((float) $aggregate->rating_average, 1) : null,
            'count' => $count,
        ];
    }

    protected function transformRating(UserRating $rating): array
    {
        return [
            'id' => $rating->id,
            'claim_id' => $rating->claim_id,
            'community_post_id' => $rating->community_post_id,
            'rating' => $rating->rating,
            'comment' => $rating->comment,
            'created_at' => $rating->created_at?->toISOString(),
            'reviewer' => $rating->reviewer ? $this->transformUser($rating->reviewer) : null,
            'item' => $rating->communityPost ? [
                'id' => $rating->communityPost->id,
                'title' => $rating->communityPost->title,
                'post_type' => $rating->communityPost->post_type,
            ] : null,
        ];
    }

    protected function transformPendingRating(User $reviewer, Claim $claim): ?array
    {
        $eligibility = $this->resolveEligibility($reviewer, $claim);

        if (! $eligibility['eligible'] || ! $eligibility['reviewed_user']) {
            return null;
        }

        return [
            'claim_id' => $claim->id,
            'community_post_id' => $claim->community_post_id,
            'returned_at' => optional($claim->returned_at)?->toISOString(),
            'reviewed_user' => $eligibility['reviewed_user'],
            'viewer_role' => $eligibility['viewer_role'],
            'counterpart_role' => $eligibility['counterpart_role'],
            'can_rate' => $eligibility['can_rate'],
            'rating_submitted' => $eligibility['rating_submitted'],
            'item' => $eligibility['item'],
        ];
    }

    protected function transformItemContext(Claim $claim): ?array
    {
        $post = $claim->communityPost;

        if (! $post) {
            return null;
        }

        return [
            'id' => $post->id,
            'title' => $post->title,
            'post_type' => $post->post_type,
            'status' => $post->status,
            'category' => $post->category ? [
                'id' => $post->category->id,
                'name' => $post->category->name,
            ] : null,
            'returned_at' => optional($claim->returned_at ?? $post->returned_at)?->toISOString(),
        ];
    }

    protected function transformUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'profile_image_url' => $user->profile_image
                ? asset('storage/'.$user->profile_image)
                : null,
        ];
    }
}
