<?php

namespace App\Http\Controllers;

use App\Models\CommunityPost;
use App\Models\SavedPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavedPostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $posts = SavedPost::query()
            ->with([
                'communityPost.user:id,name,email,profile_image',
                'communityPost.category:id,name',
                'communityPost.approvedBy:id,name',
                'communityPost.claims.user:id,name,email,profile_image',
                'communityPost.claims.reviewedBy:id,name',
            ])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->pluck('communityPost')
            ->filter(fn (?CommunityPost $post) => $post !== null && $this->canViewSavedPost($request, $post))
            ->values();

        return response()->json([
            'posts' => $posts->map(fn (CommunityPost $post) => $this->transformPost($post))->all(),
            'ids' => $posts->pluck('id')->map(fn ($id) => (int) $id)->values()->all(),
        ]);
    }

    public function ids(Request $request): JsonResponse
    {
        return response()->json([
            'ids' => SavedPost::query()
                ->where('user_id', $request->user()->id)
                ->pluck('community_post_id')
                ->map(fn ($id) => (int) $id)
                ->values()
                ->all(),
        ]);
    }

    public function store(Request $request, CommunityPost $communityPost): JsonResponse
    {
        abort_unless($this->canViewSavedPost($request, $communityPost), 404);

        SavedPost::firstOrCreate([
            'user_id' => $request->user()->id,
            'community_post_id' => $communityPost->id,
        ]);

        return response()->json([
            'message' => 'Post saved.',
            'post' => $this->transformPost($communityPost->load([
                'user:id,name,email,profile_image',
                'category:id,name',
                'approvedBy:id,name',
                'claims.user:id,name,email,profile_image',
                'claims.reviewedBy:id,name',
            ])),
        ], 201);
    }

    public function destroy(Request $request, CommunityPost $communityPost): JsonResponse
    {
        SavedPost::query()
            ->where('user_id', $request->user()->id)
            ->where('community_post_id', $communityPost->id)
            ->delete();

        return response()->json([
            'message' => 'Removed from saved posts.',
        ]);
    }

    protected function canViewSavedPost(Request $request, CommunityPost $post): bool
    {
        $user = $request->user();

        if ($user->role === 'admin' || $post->user_id === $user->id) {
            return true;
        }

        if ($post->post_type === 'community') {
            return in_array($post->status, ['pending', 'approved', 'claimed', 'returned'], true);
        }

        return in_array($post->status, ['approved', 'claimed', 'returned'], true);
    }

    protected function transformPost(CommunityPost $post): array
    {
        return [
            'id' => $post->id,
            'post_type' => $post->post_type,
            'title' => $post->post_type === 'community' && $post->title === 'Community Post'
                ? null
                : $post->title,
            'content' => $post->content,
            'location' => $post->location,
            'latitude' => $post->latitude !== null ? (float) $post->latitude : null,
            'longitude' => $post->longitude !== null ? (float) $post->longitude : null,
            'item_date' => optional($post->item_date)?->format('Y-m-d'),
            'status' => $post->status,
            'admin_note' => $post->admin_note,
            'created_at' => optional($post->created_at)?->toISOString(),
            'approved_at' => optional($post->approved_at)?->toISOString(),
            'rejected_at' => optional($post->rejected_at)?->toISOString(),
            'returned_at' => optional($post->returned_at)?->toISOString(),
            'image_url' => $post->image ? asset('storage/'.$post->image) : null,
            'user' => $post->user ? [
                'id' => $post->user->id,
                'name' => $post->user->name,
                'email' => $post->user->email,
                'profile_image_url' => $post->user->profile_image
                    ? asset('storage/'.$post->user->profile_image)
                    : null,
            ] : null,
            'category' => $post->category ? [
                'id' => $post->category->id,
                'name' => $post->category->name,
            ] : null,
            'approved_by' => $post->approvedBy ? [
                'id' => $post->approvedBy->id,
                'name' => $post->approvedBy->name,
            ] : null,
            'claims' => $post->relationLoaded('claims')
                ? $post->claims
                    ->sortByDesc('created_at')
                    ->values()
                    ->map(fn ($claim) => [
                        'id' => $claim->id,
                        'status' => $claim->status,
                        'proof_description' => $claim->proof_description,
                        'contact_phone' => $claim->contact_phone,
                        'admin_note' => $claim->admin_note,
                        'reviewed_at' => optional($claim->reviewed_at)?->toISOString(),
                        'returned_at' => optional($claim->returned_at)?->toISOString(),
                        'created_at' => optional($claim->created_at)?->toISOString(),
                        'user' => $claim->user ? [
                            'id' => $claim->user->id,
                            'name' => $claim->user->name,
                            'email' => $claim->user->email,
                            'profile_image_url' => $claim->user->profile_image
                                ? asset('storage/'.$claim->user->profile_image)
                                : null,
                        ] : null,
                        'reviewed_by' => $claim->reviewedBy ? [
                            'id' => $claim->reviewedBy->id,
                            'name' => $claim->reviewedBy->name,
                        ] : null,
                    ])
                    ->all()
                : [],
        ];
    }
}
