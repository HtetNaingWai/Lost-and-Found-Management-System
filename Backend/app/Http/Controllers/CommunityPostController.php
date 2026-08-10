<?php

namespace App\Http\Controllers;

use App\Models\CommunityPost;
use App\Models\UserNotification;
use App\Services\NotificationService;
use App\Services\WebhookDispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommunityPostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = CommunityPost::query()
            ->with([
                'user:id,name,email,profile_image',
                'category:id,name',
                'approvedBy:id,name',
            ])
            ->latest();

        if ($user->role !== 'admin') {
            $query->where(function ($builder) use ($user) {
                $builder
                    ->whereIn('status', ['pending', 'approved', 'claimed', 'returned'])
                    ->orWhere(function ($rejectedQuery) use ($user) {
                        $rejectedQuery
                            ->where('status', 'rejected')
                            ->where('user_id', $user->id);
                    });
            });
        }

        return response()->json([
            'posts' => $query->get()->map(fn (CommunityPost $post) => $this->transformPost($post)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'post_type' => ['required', 'in:community,lost,found'],
            'title' => ['nullable', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'category_id' => ['nullable', 'exists:categories,id'],
            'location' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'item_date' => ['nullable', 'date'],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $isItemPost = in_array($validated['post_type'], ['lost', 'found'], true);

        if ($isItemPost) {
            $request->validate([
                'title' => ['required', 'string', 'max:255'],
                'location' => ['required', 'string', 'max:255'],
                'latitude' => ['required', 'numeric', 'between:-90,90'],
                'longitude' => ['required', 'numeric', 'between:-180,180'],
                'item_date' => ['required', 'date'],
            ]);
        }

        $imagePath = $request->file('image')?->store('community-posts', 'public');

        $post = CommunityPost::create([
            'user_id' => $request->user()->id,
            'post_type' => $validated['post_type'],
            'title' => $validated['title'] ?? ($isItemPost ? null : 'Community Post'),
            'content' => $validated['content'],
            'category_id' => $validated['category_id'] ?? null,
            'location' => $validated['location'] ?? null,
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'item_date' => $validated['item_date'] ?? null,
            'image' => $imagePath,
            'status' => 'pending',
        ]);

        $notification = NotificationService::create(
            $request->user()->id,
            'post_submitted',
            $isItemPost ? ucfirst($validated['post_type']).' post submitted' : 'Community post submitted',
            $isItemPost
                ? 'Your post is pending admin review.'
                : 'Your community post is now visible in the community feed.',
            [
                'post_id' => $post->id,
                'post_type' => $post->post_type,
            ],
        );

        $postPayload = $this->transformPost($post->fresh([
            'user:id,name,email,profile_image',
            'category:id,name',
            'approvedBy:id,name',
        ]));

        WebhookDispatcher::dispatch('post_created', [
            'post' => $postPayload,
        ]);

        return response()->json([
            'message' => $isItemPost
                ? ucfirst($validated['post_type']).' post submitted successfully and is awaiting admin review.'
                : 'Community post created successfully.',
            'post' => $postPayload,
            'notification' => $this->transformNotification($notification),
            'activity' => [
                'id' => 'post-'.$post->id,
                'title' => $isItemPost ? ucfirst($post->post_type).' post submitted' : 'Community post submitted',
                'detail' => $post->title ?: 'Community post',
                'time' => optional($post->created_at)?->toISOString(),
                'icon' => $isItemPost ? 'document' : 'community',
            ],
        ], 201);
    }

    public function myPosts(Request $request): JsonResponse
    {
        return response()->json([
            'posts' => CommunityPost::query()
                ->with([
                    'user:id,name,email,profile_image',
                    'category:id,name',
                    'approvedBy:id,name',
                    'claims.user:id,name,email,profile_image',
                    'claims.reviewedBy:id,name',
                ])
                ->where('user_id', $request->user()->id)
                ->latest()
                ->get()
                ->map(fn (CommunityPost $post) => $this->transformPost($post)),
        ]);
    }

    public function show(Request $request, CommunityPost $communityPost): JsonResponse
    {
        $user = $request->user();

        if (
            $communityPost->status === 'rejected'
            && $user->role !== 'admin'
            && $communityPost->user_id !== $user->id
        ) {
            abort(404);
        }

        return response()->json([
            'post' => $this->transformPost($communityPost->load([
                'user:id,name,email,profile_image',
                'category:id,name',
                'approvedBy:id,name',
                'claims.user:id,name,email,profile_image',
                'claims.reviewedBy:id,name',
            ])),
        ]);
    }

    public function lostItems(): JsonResponse
    {
        return response()->json([
            'posts' => CommunityPost::query()
                ->with([
                    'user:id,name,email,profile_image',
                    'category:id,name',
                    'approvedBy:id,name',
                ])
                ->where('post_type', 'lost')
                ->where('status', 'approved')
                ->latest()
                ->get()
                ->map(fn (CommunityPost $post) => $this->transformPost($post)),
        ]);
    }

    public function foundItems(): JsonResponse
    {
        return response()->json([
            'posts' => CommunityPost::query()
                ->with([
                    'user:id,name,email,profile_image',
                    'category:id,name',
                    'approvedBy:id,name',
                ])
                ->where('post_type', 'found')
                ->where('status', 'approved')
                ->latest()
                ->get()
                ->map(fn (CommunityPost $post) => $this->transformPost($post)),
        ]);
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

    protected function transformNotification(UserNotification $notification): array
    {
        return NotificationService::transform($notification);
    }
}
