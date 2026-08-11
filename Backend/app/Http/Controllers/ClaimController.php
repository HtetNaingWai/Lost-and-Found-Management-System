<?php

namespace App\Http\Controllers;

use App\Models\Claim;
use App\Models\CommunityPost;
use App\Models\Message;
use App\Models\User;
use App\Models\UserNotification;
use App\Models\UserRating;
use App\Services\NotificationService;
use App\Services\WebhookDispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class ClaimController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $claims = Claim::query()
            ->with([
                'user:id,name,email,profile_image',
                'communityPost.user:id,name,email,profile_image',
                'communityPost.category:id,name',
                'reviewedBy:id,name',
            ])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(fn (Claim $claim) => $this->transformClaim($claim, $request->user()));

        return response()->json([
            'claims' => $claims,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'community_post_id' => ['required', 'exists:community_posts,id'],
            'proof_description' => ['required', 'string'],
            'contact_phone' => ['required', 'string', 'max:50'],
        ]);

        /** @var CommunityPost $post */
        $post = CommunityPost::query()
            ->with(['user:id,name,email,profile_image', 'category:id,name'])
            ->findOrFail($validated['community_post_id']);

        if (!in_array($post->post_type, ['lost', 'found'], true) || $post->status !== 'approved') {
            return response()->json([
                'message' => 'Only approved item posts can be claimed.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($post->user_id === $request->user()->id) {
            return response()->json([
                'message' => 'You cannot claim your own item post.',
            ], Response::HTTP_FORBIDDEN);
        }

        $existingClaim = Claim::query()
            ->where('community_post_id', $post->id)
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existingClaim) {
            return response()->json([
                'message' => 'You already submitted a claim for this item.',
                'claim' => $this->transformClaim($existingClaim->load([
                    'user:id,name,email,profile_image',
                    'communityPost.user:id,name,email,profile_image',
                    'communityPost.category:id,name',
                    'reviewedBy:id,name',
                ]), $request->user()),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $claim = Claim::create([
            'community_post_id' => $post->id,
            'user_id' => $request->user()->id,
            'proof_description' => $validated['proof_description'],
            'contact_phone' => $validated['contact_phone'],
            'status' => 'pending',
        ]);

        $claimantDetail = $post->post_type === 'found'
            ? ($post->title ?: 'Found item claim').' was sent to the finder for review.'
            : ($post->title ?: 'Lost item return').' was sent to the owner for review.';

        $claimantNotification = NotificationService::create(
            $request->user()->id,
            'claim_submitted',
            'Claim submitted',
            $claimantDetail,
            [
                'claim_id' => $claim->id,
                'community_post_id' => $post->id,
                'section' => 'my-returns',
            ],
        );

        if ($post->user_id !== $request->user()->id) {
            $itemLabel = $post->post_type === 'found' ? 'found item' : 'lost item';

            NotificationService::create(
                $post->user_id,
                'claim_received',
                'New claim received',
                ($request->user()->name ?: 'A user').' submitted a claim for your '.$itemLabel.' "'.($post->title ?: 'Item').'".',
                [
                    'claim_id' => $claim->id,
                    'community_post_id' => $post->id,
                    'claimant_id' => $request->user()->id,
                    'section' => $post->post_type === 'lost' ? 'my-lost' : 'my-found',
                ],
            );
        }

        WebhookDispatcher::dispatch('claim_created', [
            'claim' => $this->transformClaim($claim->load([
                'user:id,name,email,profile_image',
                'communityPost.user:id,name,email,profile_image',
                'communityPost.category:id,name',
                'reviewedBy:id,name',
            ]), $request->user()),
        ]);

        return response()->json([
            'message' => 'Claim submitted successfully. The finder has been notified.',
            'claim' => $this->transformClaim($claim->load([
                'user:id,name,email,profile_image',
                'communityPost.user:id,name,email,profile_image',
                'communityPost.category:id,name',
                'reviewedBy:id,name',
            ]), $request->user()),
            'activity' => [
                'id' => 'claim-'.$claim->id,
                'title' => 'Claim submitted',
                'detail' => ($post->title ?: 'Found item claim').' is now pending finder review.',
                'time' => optional($claim->created_at)?->toISOString(),
                'icon' => 'clipboard',
            ],
            'notification' => $this->transformNotification($claimantNotification),
        ], Response::HTTP_CREATED);
    }

    public function update(Request $request, Claim $claim): JsonResponse
    {
        abort_unless($claim->user_id === $request->user()->id, Response::HTTP_FORBIDDEN);

        if ($claim->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending claims can be edited.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $validated = $request->validate([
            'proof_description' => ['required', 'string'],
            'contact_phone' => ['required', 'string', 'max:50'],
        ]);

        $claim->update([
            'proof_description' => $validated['proof_description'],
            'contact_phone' => $validated['contact_phone'],
        ]);

        return response()->json([
            'message' => 'Claim updated successfully.',
            'claim' => $this->transformClaim($claim->fresh([
                'user:id,name,email,profile_image',
                'communityPost.user:id,name,email,profile_image',
                'communityPost.category:id,name',
                'reviewedBy:id,name',
            ]), $request->user()),
        ]);
    }

    public function destroy(Request $request, Claim $claim): JsonResponse
    {
        abort_unless($claim->user_id === $request->user()->id, Response::HTTP_FORBIDDEN);

        if ($claim->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending claims can be withdrawn.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $claim->delete();

        if ($claim->community_post_id) {
            $this->restoreApprovedPostIfNoActiveClaims($claim->community_post_id);
        }

        return response()->json([
            'message' => 'Claim withdrawn successfully.',
        ]);
    }

    public function markReturned(Request $request, Claim $claim): JsonResponse
    {
        $claim->load([
            'user:id,name,email,profile_image',
            'communityPost.user:id,name,email,profile_image',
            'communityPost.category:id,name',
            'reviewedBy:id,name',
        ]);

        if (!$claim->communityPost || !in_array($claim->communityPost->post_type, ['lost', 'found'], true)) {
            return response()->json([
                'message' => 'Only item claims can be marked as returned.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        abort_unless($claim->communityPost->user_id === $request->user()->id, Response::HTTP_FORBIDDEN);

        if (!in_array($claim->status, ['pending', 'approved'], true)) {
            return response()->json([
                'message' => 'Only active claims can be marked as returned.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return $this->completeReturn($request, $claim);
    }

    public function returnCommunityPost(Request $request, CommunityPost $communityPost): JsonResponse
    {
        $validated = $request->validate([
            'participant_user_id' => ['required', 'exists:users,id'],
        ]);

        $communityPost->load([
            'user:id,name,email,phone,profile_image',
            'category:id,name',
            'claims.user:id,name,email,phone,profile_image',
            'claims.reviewedBy:id,name',
        ]);

        if (!in_array($communityPost->post_type, ['lost', 'found'], true)) {
            return response()->json([
                'message' => 'Only lost or found item posts can be marked as returned.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        abort_unless($communityPost->user_id === $request->user()->id, Response::HTTP_FORBIDDEN);

        if ($communityPost->status === 'returned') {
            return response()->json([
                'message' => 'This item has already been marked as returned.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (!in_array($communityPost->status, ['approved', 'claimed'], true)) {
            return response()->json([
                'message' => 'Only active approved or claimed items can be marked as returned.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $participant = User::query()->findOrFail($validated['participant_user_id']);

        if ((int) $participant->id === (int) $communityPost->user_id) {
            return response()->json([
                'message' => 'You cannot complete a return with yourself.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $hasConversation = Message::query()
            ->where('community_post_id', $communityPost->id)
            ->where(function ($query) use ($communityPost, $participant) {
                $query
                    ->where(function ($nested) use ($communityPost, $participant) {
                        $nested
                            ->where('sender_id', $communityPost->user_id)
                            ->where('receiver_id', $participant->id);
                    })
                    ->orWhere(function ($nested) use ($communityPost, $participant) {
                        $nested
                            ->where('sender_id', $participant->id)
                            ->where('receiver_id', $communityPost->user_id);
                    });
            })
            ->exists();

        $claim = Claim::query()
            ->where('community_post_id', $communityPost->id)
            ->where('user_id', $participant->id)
            ->first();

        if (!$claim && !$hasConversation) {
            return response()->json([
                'message' => 'A return can only be completed with a member connected to this item conversation.',
            ], Response::HTTP_FORBIDDEN);
        }

        if ($claim && $claim->status === 'rejected') {
            return response()->json([
                'message' => 'Rejected claims cannot be marked as returned.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($claim && $claim->status === 'returned') {
            return response()->json([
                'message' => 'This return has already been completed.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (!$claim) {
            $claim = Claim::create([
                'item_id' => null,
                'community_post_id' => $communityPost->id,
                'user_id' => $participant->id,
                'proof_description' => 'Return completed through a FindIt item conversation.',
                'contact_phone' => $participant->phone ?: 'Provided through FindIt messages',
                'status' => 'approved',
                'reviewed_at' => now(),
            ]);
        }

        $claim->load([
            'user:id,name,email,profile_image',
            'communityPost.user:id,name,email,profile_image',
            'communityPost.category:id,name',
            'reviewedBy:id,name',
        ]);

        return $this->completeReturn($request, $claim);
    }

    protected function completeReturn(Request $request, Claim $claim): JsonResponse
    {
        $returnedAt = now();

        [$claimPayload, $finderNotification, $ratingNotifications] = DB::transaction(function () use ($request, $claim, $returnedAt) {
            $claim->status = 'returned';
            $claim->returned_at = $returnedAt;
            $claim->save();

            $claim->communityPost->status = 'returned';
            $claim->communityPost->returned_at = $returnedAt;
            $claim->communityPost->save();

            NotificationService::createOnce(
                $claim->user_id,
                'item_returned',
                'Item returned',
                ($claim->communityPost->title ?: 'Found item').' has been marked as returned.',
                [
                    'claim_id' => $claim->id,
                    'community_post_id' => $claim->community_post_id,
                    'returned_by' => $request->user()->id,
                    'section' => 'my-returns',
                ],
                "item_returned:claim:{$claim->id}:recipient:{$claim->user_id}",
            );

            $finderNotification = NotificationService::createOnce(
                $claim->communityPost->user_id,
                'return_completed',
                'Return completed',
                ($claim->communityPost->title ?: 'Found item').' has been recorded as successfully returned.',
                [
                    'claim_id' => $claim->id,
                    'community_post_id' => $claim->community_post_id,
                    'claimant_id' => $claim->user_id,
                    'section' => $claim->communityPost->post_type === 'lost' ? 'my-lost' : 'my-found',
                ],
                "return_completed:claim:{$claim->id}:recipient:{$claim->communityPost->user_id}",
            );

            $ratingNotifications = $this->createRatingAvailableNotifications($claim);

            $claimPayload = $this->transformClaim($claim->fresh([
                'user:id,name,email,profile_image',
                'communityPost.user:id,name,email,profile_image',
                'communityPost.category:id,name',
                'reviewedBy:id,name',
            ]), $request->user());

            return [$claimPayload, $finderNotification, $ratingNotifications];
        });

        WebhookDispatcher::dispatch('item_returned', [
            'claim' => $claimPayload,
        ]);

        return response()->json([
            'message' => 'Item marked as returned.',
            'claim' => $claimPayload,
            'notification' => $this->transformNotification($finderNotification),
            'rating_notifications' => collect($ratingNotifications)
                ->map(fn (UserNotification $notification) => $this->transformNotification($notification))
                ->values(),
        ]);
    }

    /**
     * @return list<UserNotification>
     */
    protected function createRatingAvailableNotifications(Claim $claim): array
    {
        $post = $claim->communityPost;

        if (! $post || $claim->status !== 'returned') {
            return [];
        }

        $itemTitle = $post->title ?: 'Item';
        $claimantName = $claim->user?->name ?: 'the other member';
        $posterName = $post->user?->name ?: 'the item poster';
        $ownerSection = $post->post_type === 'lost' ? 'my-lost' : 'my-found';
        $participantReviewLabel = $post->post_type === 'lost' ? 'owner' : 'finder';
        $posterReviewLabel = $post->post_type === 'lost' ? 'helper' : 'owner';

        return [
            NotificationService::createOnce(
                $claim->user_id,
                'rating_available',
                'Rate your return experience',
                'Your return for "'.$itemTitle.'" is complete. How was your experience with the '.$participantReviewLabel.', '.$posterName.'?',
                [
                    'action' => 'rating_available',
                    'claim_id' => $claim->id,
                    'community_post_id' => $claim->community_post_id,
                    'reviewed_user_id' => $post->user_id,
                    'reviewed_role' => $participantReviewLabel,
                    'section' => 'my-returns',
                ],
                "rating_available:claim:{$claim->id}:reviewer:{$claim->user_id}",
            ),
            NotificationService::createOnce(
                $post->user_id,
                'rating_available',
                'Rate your return experience',
                'Your return for "'.$itemTitle.'" is complete. How was your experience with the '.$posterReviewLabel.', '.$claimantName.'?',
                [
                    'action' => 'rating_available',
                    'claim_id' => $claim->id,
                    'community_post_id' => $claim->community_post_id,
                    'reviewed_user_id' => $claim->user_id,
                    'reviewed_role' => $posterReviewLabel,
                    'section' => $ownerSection,
                ],
                "rating_available:claim:{$claim->id}:reviewer:{$post->user_id}",
            ),
        ];
    }

    protected function transformClaim(Claim $claim, ?User $viewer = null): array
    {
        $roles = $this->resolveReturnRoles($claim, $viewer);

        return [
            'id' => $claim->id,
            'status' => $claim->status,
            'proof_description' => $claim->proof_description,
            'contact_phone' => $claim->contact_phone,
            'admin_note' => $claim->admin_note,
            'reviewed_at' => optional($claim->reviewed_at)?->toISOString(),
            'returned_at' => optional($claim->returned_at)?->toISOString(),
            'created_at' => optional($claim->created_at)?->toISOString(),
            'viewer_role' => $roles['viewer_role'],
            'counterpart_role' => $roles['counterpart_role'],
            'owner' => $roles['owner'],
            'finder' => $roles['finder'],
            'helper' => $roles['helper'],
            'successful_participant' => $roles['successful_participant'],
            'can_mark_returned' => $roles['can_mark_returned'],
            'can_rate' => $roles['can_rate'],
            'rating_submitted' => $roles['rating_submitted'],
            'user' => $claim->user ? [
                'id' => $claim->user->id,
                'name' => $claim->user->name,
                'email' => $claim->user->email,
                'profile_image_url' => $claim->user->profile_image
                    ? asset('storage/'.$claim->user->profile_image)
                    : null,
            ] : null,
            'community_post' => $claim->communityPost ? [
                'id' => $claim->communityPost->id,
                'title' => $claim->communityPost->title,
                'post_type' => $claim->communityPost->post_type,
                'status' => $claim->communityPost->status,
                'content' => $claim->communityPost->content,
                'location' => $claim->communityPost->location,
                'item_date' => optional($claim->communityPost->item_date)?->format('Y-m-d'),
                'returned_at' => optional($claim->communityPost->returned_at)?->toISOString(),
                'image_url' => $claim->communityPost->image
                    ? asset('storage/'.$claim->communityPost->image)
                    : null,
                'category' => $claim->communityPost->category ? [
                    'id' => $claim->communityPost->category->id,
                    'name' => $claim->communityPost->category->name,
                ] : null,
                'user' => $claim->communityPost->user ? [
                    'id' => $claim->communityPost->user->id,
                    'name' => $claim->communityPost->user->name,
                    'email' => $claim->communityPost->user->email,
                    'profile_image_url' => $claim->communityPost->user->profile_image
                        ? asset('storage/'.$claim->communityPost->user->profile_image)
                        : null,
                ] : null,
            ] : null,
            'reviewed_by' => $claim->reviewedBy ? [
                'id' => $claim->reviewedBy->id,
                'name' => $claim->reviewedBy->name,
            ] : null,
        ];
    }

    protected function resolveReturnRoles(Claim $claim, ?User $viewer = null): array
    {
        $post = $claim->communityPost;
        $postUser = $post?->user;
        $participant = $claim->user;
        $postType = $post?->post_type;

        $owner = $postType === 'found' ? $participant : $postUser;
        $finder = $postType === 'found' ? $postUser : $participant;
        $helper = $postType === 'lost' ? $participant : null;
        $successfulParticipant = $postType === 'lost' ? $helper : $owner;

        $viewerRole = null;
        $counterpartRole = null;

        if ($viewer && $post) {
            if ((int) $viewer->id === (int) $post->user_id) {
                $viewerRole = $postType === 'lost' ? 'owner' : 'finder';
                $counterpartRole = $postType === 'lost' ? 'helper' : 'owner';
            } elseif ((int) $viewer->id === (int) $claim->user_id) {
                $viewerRole = $postType === 'lost' ? 'helper' : 'owner';
                $counterpartRole = $postType === 'lost' ? 'owner' : 'finder';
            }
        }

        $ratingSubmitted = false;
        if ($viewer && Schema::hasTable('user_ratings')) {
            $ratingSubmitted = UserRating::query()
                ->where('claim_id', $claim->id)
                ->where('reviewer_id', $viewer->id)
                ->exists();
        }

        $canMarkReturned = $viewer
            && $post
            && (int) $viewer->id === (int) $post->user_id
            && in_array($post->status, ['approved', 'claimed'], true)
            && in_array($claim->status, ['pending', 'approved'], true);

        return [
            'viewer_role' => $viewerRole,
            'counterpart_role' => $counterpartRole,
            'owner' => $owner ? $this->transformClaimUser($owner) : null,
            'finder' => $finder ? $this->transformClaimUser($finder) : null,
            'helper' => $helper ? $this->transformClaimUser($helper) : null,
            'successful_participant' => $successfulParticipant ? $this->transformClaimUser($successfulParticipant) : null,
            'can_mark_returned' => $canMarkReturned,
            'can_rate' => $viewerRole !== null && $claim->status === 'returned' && ! $ratingSubmitted,
            'rating_submitted' => $ratingSubmitted,
        ];
    }

    protected function transformClaimUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'profile_image_url' => $user->profile_image
                ? asset('storage/'.$user->profile_image)
                : null,
        ];
    }

    protected function transformNotification(UserNotification $notification): array
    {
        return NotificationService::transform($notification);
    }

    protected function restoreApprovedPostIfNoActiveClaims(int $communityPostId): void
    {
        CommunityPost::query()
            ->where('id', $communityPostId)
            ->where('status', 'claimed')
            ->whereNull('returned_at')
            ->update([
                'status' => 'approved',
                'returned_at' => null,
                'updated_at' => now(),
            ]);
    }
}
