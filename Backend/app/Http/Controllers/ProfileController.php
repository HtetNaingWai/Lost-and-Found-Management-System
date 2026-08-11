<?php

namespace App\Http\Controllers;

use App\Models\Claim;
use App\Models\CommunityPost;
use App\Models\User;
use App\Models\UserRating;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function publicProfile(Request $request, User $user): JsonResponse
    {
        $isUnavailable = $user->status !== 'active';

        return response()->json([
            'user' => $this->transformPublicUser($user),
            'stats' => $isUnavailable
                ? [
                    'lost_posts' => 0,
                    'found_posts' => 0,
                    'successful_returns' => 0,
                ]
                : $this->publicStats($user),
            'rating_summary' => $this->ratingSummary($user),
            'recent_reviews' => $this->recentReviews($user),
            'availability' => [
                'status' => $isUnavailable ? 'unavailable' : 'available',
                'message' => $isUnavailable ? 'This profile is currently unavailable.' : null,
                'can_message' => ! $isUnavailable && $request->user()?->id !== $user->id,
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'phone' => ['required', 'string', 'max:50'],
            'nrc_no' => ['required', 'string', 'max:255'],
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profile information updated successfully.',
            'user' => $this->transformUser($user->fresh()),
        ]);
    }

    public function updatePhoto(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'profile_image' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if ($user->profile_image) {
            Storage::disk('public')->delete($user->profile_image);
        }

        $path = $validated['profile_image']->store('profile-images', 'public');

        $user->update([
            'profile_image' => $path,
        ]);

        return response()->json([
            'message' => 'Profile image updated successfully.',
            'user' => $this->transformUser($user->fresh()),
        ]);
    }

    public function removePhoto(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->profile_image) {
            Storage::disk('public')->delete($user->profile_image);
        }

        $user->update([
            'profile_image' => null,
        ]);

        return response()->json([
            'message' => 'Profile image removed successfully.',
            'user' => $this->transformUser($user->fresh()),
        ]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        if (! Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Your current password is incorrect.',
                'errors' => [
                    'current_password' => ['Your current password is incorrect.'],
                ],
            ], 422);
        }

        $user->update([
            'password' => $validated['password'],
        ]);

        return response()->json([
            'message' => 'Password updated successfully.',
        ]);
    }

    public function updatePrivacy(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'show_phone_publicly' => ['required', 'boolean'],
            'show_email_publicly' => ['required', 'boolean'],
            'show_location_publicly' => ['required', 'boolean'],
            'public_location' => ['nullable', 'string', 'max:120'],
        ]);

        $user->update([
            'show_phone_publicly' => $validated['show_phone_publicly'],
            'show_email_publicly' => $validated['show_email_publicly'],
            'show_location_publicly' => $validated['show_location_publicly'],
            'public_location' => $validated['show_location_publicly']
                ? trim(strip_tags($validated['public_location'] ?? '')) ?: null
                : null,
        ]);

        return response()->json([
            'message' => 'Public profile privacy updated successfully.',
            'user' => $this->transformUser($user->fresh()),
        ]);
    }

    protected function publicStats(User $user): array
    {
        $postQuery = CommunityPost::query()
            ->where('user_id', $user->id)
            ->whereIn('post_type', ['lost', 'found']);

        return [
            'lost_posts' => (clone $postQuery)->where('post_type', 'lost')->count(),
            'found_posts' => (clone $postQuery)->where('post_type', 'found')->count(),
            'successful_returns' => Claim::query()
                ->where('status', 'returned')
                ->where(function ($query) use ($user) {
                    $query
                        ->where('user_id', $user->id)
                        ->orWhereHas('communityPost', fn ($postQuery) => $postQuery->where('user_id', $user->id));
                })
                ->distinct('community_post_id')
                ->count('community_post_id'),
        ];
    }

    protected function ratingSummary(User $user): array
    {
        if (! Schema::hasTable('user_ratings')) {
            return [
                'average' => null,
                'count' => 0,
            ];
        }

        $aggregate = UserRating::query()
            ->where('reviewed_user_id', $user->id)
            ->selectRaw('COUNT(*) as review_count, AVG(rating) as rating_average')
            ->first();

        $count = (int) ($aggregate->review_count ?? 0);

        return [
            'average' => $count > 0 ? round((float) $aggregate->rating_average, 1) : null,
            'count' => $count,
        ];
    }

    protected function recentReviews(User $user): array
    {
        if (! Schema::hasTable('user_ratings')) {
            return [];
        }

        return UserRating::query()
            ->with(['reviewer:id,name,profile_image', 'communityPost:id,title,post_type'])
            ->where('reviewed_user_id', $user->id)
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (UserRating $rating) => [
                'id' => $rating->id,
                'rating' => $rating->rating,
                'comment' => $rating->comment,
                'created_at' => $rating->created_at?->toISOString(),
                'reviewer' => $rating->reviewer ? [
                    'id' => $rating->reviewer->id,
                    'name' => $rating->reviewer->name,
                    'profile_image_url' => $rating->reviewer->profile_image
                        ? asset('storage/'.$rating->reviewer->profile_image)
                        : null,
                ] : null,
                'item' => $rating->communityPost ? [
                    'id' => $rating->communityPost->id,
                    'title' => $rating->communityPost->title,
                    'post_type' => $rating->communityPost->post_type,
                ] : null,
            ])
            ->all();
    }

    protected function transformPublicUser(User $user): array
    {
        $isUnavailable = $user->status !== 'active';

        return [
            'id' => $user->id,
            'name' => $user->name,
            'profile_image_url' => $user->profile_image
                ? asset('storage/'.$user->profile_image)
                : null,
            ...$user->presencePayload(),
            'member_since' => $user->created_at?->toISOString(),
            'public_phone' => (! $isUnavailable && $user->show_phone_publicly) ? $user->phone : null,
            'public_email' => (! $isUnavailable && $user->show_email_publicly) ? $user->email : null,
            'public_location' => (! $isUnavailable && $user->show_location_publicly) ? $user->public_location : null,
        ];
    }

    protected function transformUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'nrc_no' => $user->nrc_no,
            'role' => $user->role,
            'status' => $user->status,
            ...$user->presencePayload(),
            'show_phone_publicly' => (bool) $user->show_phone_publicly,
            'show_email_publicly' => (bool) $user->show_email_publicly,
            'show_location_publicly' => (bool) $user->show_location_publicly,
            'public_location' => $user->public_location,
            'profile_image_url' => $user->profile_image
                ? asset('storage/'.$user->profile_image)
                : null,
            'nrc_front_photo_url' => $user->nrc_front_photo
                ? asset('storage/'.$user->nrc_front_photo)
                : null,
            'nrc_back_photo_url' => $user->nrc_back_photo
                ? asset('storage/'.$user->nrc_back_photo)
                : null,
        ];
    }
}
