<?php

namespace App\Http\Controllers;

use App\Models\Claim;
use App\Models\CommunityPost;
use App\Models\ContactMessage;
use App\Models\Item;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class AdminController extends Controller
{
    public function overview(): JsonResponse
    {
        $pendingPosts = $this->safe(fn () => CommunityPost::query()
            ->with(['user:id,name,email,profile_image', 'category:id,name', 'approvedBy:id,name'])
            ->where('status', 'pending')
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (CommunityPost $post) => $this->transformCommunityPost($post))
            ->values()
            ->all(), []);

        $recentUsers = $this->safe(fn () => User::query()
            ->where('role', 'user')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (User $user) => $this->transformUser($user))
            ->values()
            ->all(), []);

        $recentPosts = $this->safe(fn () => CommunityPost::query()
            ->with(['user:id,name,email,profile_image', 'category:id,name', 'approvedBy:id,name'])
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (CommunityPost $post) => $this->transformCommunityPost($post))
            ->values()
            ->all(), []);

        $recentClaims = $this->safe(fn () => Claim::query()
            ->with(['user:id,name,email,profile_image', 'item:id,title,type,status', 'reviewedBy:id,name'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (Claim $claim) => $this->transformClaim($claim))
            ->values()
            ->all(), []);

        $recentContactMessages = $this->safe(fn () => ContactMessage::query()
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (ContactMessage $message) => $this->transformContactMessage($message))
            ->values()
            ->all(), []);

        return response()->json([
            'stats' => [
                'total_users' => $this->safe(fn () => User::query()->where('role', 'user')->count(), 0),
                'active_users' => $this->safe(fn () => User::query()->where('role', 'user')->where('status', 'active')->count(), 0),
                'pending_posts' => $this->safe(fn () => CommunityPost::query()->where('status', 'pending')->count(), 0),
                'approved_posts' => $this->safe(fn () => CommunityPost::query()->where('status', 'approved')->count(), 0),
                'rejected_posts' => $this->safe(fn () => CommunityPost::query()->where('status', 'rejected')->count(), 0),
                'lost_items' => $this->safe(fn () => CommunityPost::query()->where('post_type', 'lost')->count(), 0),
                'found_items' => $this->safe(fn () => CommunityPost::query()->where('post_type', 'found')->count(), 0),
                'claims' => $this->safe(fn () => Claim::query()->count(), 0),
                'contact_messages' => $this->safe(fn () => ContactMessage::query()->count(), 0),
                'new_messages' => $this->safe(fn () => ContactMessage::query()->where('status', 'new')->count(), 0),
                'pending_items' => $this->safe(fn () => CommunityPost::query()->whereIn('post_type', ['lost', 'found'])->where('status', 'pending')->count(), 0),
                'approved_items' => $this->safe(fn () => CommunityPost::query()->whereIn('post_type', ['lost', 'found'])->where('status', 'approved')->count(), 0),
                'rejected_items' => $this->safe(fn () => CommunityPost::query()->whereIn('post_type', ['lost', 'found'])->where('status', 'rejected')->count(), 0),
            ],
            'pending_posts' => $pendingPosts,
            'recent_activity' => $this->buildRecentActivity($recentUsers, $recentPosts, $recentClaims, $recentContactMessages),
            'recent_users' => $recentUsers,
            'recent_items' => $recentPosts,
            'recent_claims' => $recentClaims,
            'recent_contact_messages' => $recentContactMessages,
        ]);
    }

    public function users(): JsonResponse
    {
        $users = User::query()
            ->latest()
            ->get()
            ->map(fn (User $user) => $this->transformUser($user));

        return response()->json([
            'users' => $users,
        ]);
    }

    public function updateUser(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'phone' => ['nullable', 'string', 'max:50'],
            'role' => ['sometimes', 'in:admin,user'],
            'status' => ['sometimes', 'in:active,disabled'],
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'User updated successfully.',
            'user' => $this->transformUser($user->fresh()),
        ]);
    }

    public function items(): JsonResponse
    {
        $items = Item::query()
            ->with(['user:id,name,email', 'category:id,name', 'approvedBy:id,name'])
            ->latest()
            ->get()
            ->map(fn (Item $item) => $this->transformItem($item));

        return response()->json([
            'items' => $items,
        ]);
    }

    public function communityPosts(): JsonResponse
    {
        return response()->json([
            'posts' => CommunityPost::query()
                ->with(['user:id,name,email,profile_image', 'category:id,name', 'approvedBy:id,name'])
                ->latest()
                ->get()
                ->map(fn (CommunityPost $post) => $this->transformCommunityPost($post)),
        ]);
    }

    public function pendingCommunityPosts(): JsonResponse
    {
        return response()->json([
            'posts' => CommunityPost::query()
                ->with(['user:id,name,email,profile_image', 'category:id,name', 'approvedBy:id,name'])
                ->where('status', 'pending')
                ->latest()
                ->get()
                ->map(fn (CommunityPost $post) => $this->transformCommunityPost($post)),
        ]);
    }

    public function claims(): JsonResponse
    {
        $claims = $this->safe(fn () => Claim::query()
            ->with(['user:id,name,email,profile_image', 'item:id,title,type,status,location,item_date,image', 'reviewedBy:id,name'])
            ->latest()
            ->get()
            ->map(fn (Claim $claim) => $this->transformClaim($claim))
            ->values()
            ->all(), []);

        return response()->json([
            'claims' => $claims,
        ]);
    }

    public function updateCommunityPost(Request $request, CommunityPost $communityPost): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,approved,rejected'],
            'admin_note' => ['nullable', 'string'],
        ]);

        if ($validated['status'] === 'approved') {
            $communityPost->status = 'approved';
            $communityPost->approved_by = $request->user()->id;
            $communityPost->approved_at = now();
            $communityPost->rejected_at = null;
        }

        if ($validated['status'] === 'rejected') {
            $communityPost->status = 'rejected';
            $communityPost->rejected_at = now();
            $communityPost->approved_by = null;
            $communityPost->approved_at = null;
        }

        if ($validated['status'] === 'pending') {
            $communityPost->status = 'pending';
            $communityPost->approved_by = null;
            $communityPost->approved_at = null;
            $communityPost->rejected_at = null;
        }

        $communityPost->admin_note = $validated['admin_note'] ?? null;
        $communityPost->save();

        return response()->json([
            'message' => 'Community post updated successfully.',
            'post' => $this->transformCommunityPost($communityPost->fresh([
                'user:id,name,email,profile_image',
                'category:id,name',
                'approvedBy:id,name',
            ])),
        ]);
    }

    public function approveCommunityPost(Request $request, CommunityPost $communityPost): JsonResponse
    {
        $communityPost->status = 'approved';
        $communityPost->admin_note = $request->input('admin_note');
        $communityPost->approved_by = $request->user()->id;
        $communityPost->approved_at = now();
        $communityPost->rejected_at = null;
        $communityPost->save();

        return response()->json([
            'message' => 'Community post approved successfully.',
            'post' => $this->transformCommunityPost($communityPost->fresh([
                'user:id,name,email,profile_image',
                'category:id,name',
                'approvedBy:id,name',
            ])),
        ]);
    }

    public function rejectCommunityPost(Request $request, CommunityPost $communityPost): JsonResponse
    {
        $validated = $request->validate([
            'admin_note' => ['nullable', 'string'],
        ]);

        $communityPost->status = 'rejected';
        $communityPost->admin_note = $validated['admin_note'] ?? null;
        $communityPost->rejected_at = now();
        $communityPost->approved_at = null;
        $communityPost->approved_by = null;
        $communityPost->save();

        return response()->json([
            'message' => 'Community post rejected successfully.',
            'post' => $this->transformCommunityPost($communityPost->fresh([
                'user:id,name,email,profile_image',
                'category:id,name',
                'approvedBy:id,name',
            ])),
        ]);
    }

    public function updateItem(Request $request, Item $item): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:pending,approved,rejected,claimed,returned'],
            'admin_note' => ['nullable', 'string'],
        ]);

        $item->status = $validated['status'];
        $item->admin_note = $validated['admin_note'] ?? null;

        if ($validated['status'] === 'approved') {
            $item->approved_by = $request->user()->id;
            $item->approved_at = now();
            $item->rejected_at = null;
        }

        if ($validated['status'] === 'rejected') {
            $item->rejected_at = now();
        }

        if ($validated['status'] === 'returned') {
            $item->returned_at = now();
        }

        if ($validated['status'] === 'pending') {
            $item->approved_at = null;
            $item->approved_by = null;
            $item->rejected_at = null;
            $item->returned_at = null;
        }

        $item->save();

        return response()->json([
            'message' => 'Item updated successfully.',
            'item' => $this->transformItem($item->fresh(['user:id,name,email', 'category:id,name', 'approvedBy:id,name'])),
        ]);
    }

    public function contactMessages(): JsonResponse
    {
        $messages = ContactMessage::query()
            ->latest()
            ->get()
            ->map(fn (ContactMessage $message) => $this->transformContactMessage($message));

        return response()->json([
            'messages' => $messages,
        ]);
    }

    public function updateContactMessage(Request $request, ContactMessage $contactMessage): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:new,read,replied'],
        ]);

        $contactMessage->update($validated);

        return response()->json([
            'message' => 'Contact message updated successfully.',
            'contact_message' => $this->transformContactMessage($contactMessage->fresh()),
        ]);
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
            'created_at' => optional($user->created_at)?->toISOString(),
            'profile_image_url' => $user->profile_image
                ? asset('storage/'.$user->profile_image)
                : null,
        ];
    }

    protected function transformItem(Item $item): array
    {
        return [
            'id' => $item->id,
            'title' => $item->title,
            'type' => $item->type,
            'status' => $item->status,
            'description' => $item->description,
            'location' => $item->location,
            'item_date' => optional($item->item_date)?->format('Y-m-d'),
            'admin_note' => $item->admin_note,
            'created_at' => optional($item->created_at)?->toISOString(),
            'image_url' => $item->image
                ? asset('storage/'.$item->image)
                : null,
            'user' => $item->user ? [
                'id' => $item->user->id,
                'name' => $item->user->name,
                'email' => $item->user->email,
            ] : null,
            'category' => $item->category ? [
                'id' => $item->category->id,
                'name' => $item->category->name,
            ] : null,
            'approved_by' => $item->approvedBy ? [
                'id' => $item->approvedBy->id,
                'name' => $item->approvedBy->name,
            ] : null,
        ];
    }

    protected function transformContactMessage(ContactMessage $message): array
    {
        return [
            'id' => $message->id,
            'name' => $message->name,
            'email' => $message->email,
            'phone' => $message->phone,
            'subject' => $message->subject,
            'message' => $message->message,
            'status' => $message->status,
            'created_at' => optional($message->created_at)?->toISOString(),
        ];
    }

    protected function transformClaim(Claim $claim): array
    {
        return [
            'id' => $claim->id,
            'status' => $claim->status,
            'proof_description' => $claim->proof_description,
            'contact_phone' => $claim->contact_phone,
            'admin_note' => $claim->admin_note,
            'reviewed_at' => optional($claim->reviewed_at)?->toISOString(),
            'created_at' => optional($claim->created_at)?->toISOString(),
            'user' => $claim->user ? [
                'id' => $claim->user->id,
                'name' => $claim->user->name,
                'email' => $claim->user->email,
                'profile_image_url' => $claim->user->profile_image
                    ? asset('storage/'.$claim->user->profile_image)
                    : null,
            ] : null,
            'item' => $claim->item ? [
                'id' => $claim->item->id,
                'title' => $claim->item->title,
                'type' => $claim->item->type,
                'status' => $claim->item->status,
                'location' => $claim->item->location,
                'item_date' => optional($claim->item->item_date)?->format('Y-m-d'),
                'image_url' => $claim->item->image
                    ? asset('storage/'.$claim->item->image)
                    : null,
            ] : null,
            'reviewed_by' => $claim->reviewedBy ? [
                'id' => $claim->reviewedBy->id,
                'name' => $claim->reviewedBy->name,
            ] : null,
        ];
    }

    protected function transformCommunityPost(CommunityPost $post): array
    {
        return [
            'id' => $post->id,
            'title' => $post->post_type === 'community' && $post->title === 'Community Post'
                ? null
                : $post->title,
            'type' => $post->post_type,
            'post_type' => $post->post_type,
            'status' => $post->status,
            'description' => $post->content,
            'content' => $post->content,
            'location' => $post->location,
            'item_date' => optional($post->item_date)?->format('Y-m-d'),
            'admin_note' => $post->admin_note,
            'created_at' => optional($post->created_at)?->toISOString(),
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

    protected function buildRecentActivity(
        array $recentUsers,
        array $recentPosts,
        array $recentClaims,
        array $recentContactMessages
    ): array {
        $activities = [
            ...array_map(fn (array $user) => [
                'id' => 'user-'.$user['id'],
                'type' => 'user',
                'title' => 'User registered',
                'detail' => $user['name'].' created a FindIt account.',
                'time' => $user['created_at'],
                'icon' => 'personAdd',
            ], $recentUsers),
            ...array_map(fn (array $post) => [
                'id' => 'post-'.$post['id'],
                'type' => 'post',
                'title' => match ($post['status']) {
                    'approved' => 'Post approved',
                    'rejected' => 'Post rejected',
                    default => 'Post submitted',
                },
                'detail' => trim(($post['user']['name'] ?? 'A user').' submitted '.($post['title'] ?: ucfirst($post['post_type'])).'.'),
                'time' => $post['created_at'],
                'icon' => match ($post['status']) {
                    'approved' => 'shield',
                    'rejected' => 'close',
                    default => 'document',
                },
            ], $recentPosts),
            ...array_map(fn (array $claim) => [
                'id' => 'claim-'.$claim['id'],
                'type' => 'claim',
                'title' => 'Claim requested',
                'detail' => trim(($claim['user']['name'] ?? 'A user').' requested claim review for '.($claim['item']['title'] ?? 'an item').'.'),
                'time' => $claim['created_at'],
                'icon' => 'clipboard',
            ], $recentClaims),
            ...array_map(fn (array $message) => [
                'id' => 'contact-'.$message['id'],
                'type' => 'contact',
                'title' => 'Contact message received',
                'detail' => trim($message['name'].' sent a message'.($message['subject'] ? ' about "'.$message['subject'].'".' : '.')),
                'time' => $message['created_at'],
                'icon' => 'mail',
            ], $recentContactMessages),
        ];

        usort($activities, function (array $left, array $right) {
            $leftTime = $left['time'] ? strtotime($left['time']) : 0;
            $rightTime = $right['time'] ? strtotime($right['time']) : 0;

            return $rightTime <=> $leftTime;
        });

        return array_slice($activities, 0, 10);
    }

    protected function safe(callable $callback, mixed $fallback): mixed
    {
        try {
            return $callback();
        } catch (Throwable) {
            return $fallback;
        }
    }
}
