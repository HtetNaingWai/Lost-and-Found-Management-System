<?php

namespace App\Http\Controllers;

use App\Models\CommunityPost;
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
                    ->whereIn('status', ['pending', 'approved'])
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
            'item_date' => ['nullable', 'date'],
            'image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $isItemPost = in_array($validated['post_type'], ['lost', 'found'], true);

        if ($isItemPost) {
            $request->validate([
                'title' => ['required', 'string', 'max:255'],
                'location' => ['required', 'string', 'max:255'],
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
            'item_date' => $validated['item_date'] ?? null,
            'image' => $imagePath,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => $isItemPost
                ? ucfirst($validated['post_type']).' post submitted successfully and is awaiting admin review.'
                : 'Community post created successfully.',
            'post' => $this->transformPost($post->fresh([
                'user:id,name,email,profile_image',
                'category:id,name',
                'approvedBy:id,name',
            ])),
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
            'item_date' => optional($post->item_date)?->format('Y-m-d'),
            'status' => $post->status,
            'admin_note' => $post->admin_note,
            'created_at' => optional($post->created_at)?->toISOString(),
            'approved_at' => optional($post->approved_at)?->toISOString(),
            'rejected_at' => optional($post->rejected_at)?->toISOString(),
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
        ];
    }
}
