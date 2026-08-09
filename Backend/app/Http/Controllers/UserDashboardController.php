<?php

namespace App\Http\Controllers;

use App\Models\Claim;
use App\Models\CommunityPost;
use App\Models\Item;
use App\Models\Message;
use App\Models\UserNotification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserDashboardController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $reportedPostsQuery = CommunityPost::query()
            ->with(['category:id,name'])
            ->where('user_id', $user->id)
            ->whereIn('post_type', ['lost', 'found']);

        $recentPosts = (clone $reportedPostsQuery)
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (CommunityPost $post) => $this->transformPost($post))
            ->values()
            ->all();

        $claims = Claim::query()
            ->with([
                'communityPost.user:id,name,email,profile_image',
                'communityPost.category:id,name',
            ])
            ->where('user_id', $user->id)
            ->latest()
            ->limit(6)
            ->get();

        $receivedMessages = Message::query()
            ->with([
                'sender:id,name,email,profile_image',
                'receiver:id,name,email,profile_image',
            ])
            ->where('receiver_id', $user->id)
            ->latest()
            ->limit(6)
            ->get();

        $activities = collect([
            ...collect($recentPosts)->map(fn (array $post) => [
                'id' => 'post-'.$post['id'],
                'title' => match ($post['status']) {
                    'approved' => 'Post approved',
                    'rejected' => 'Post rejected',
                    'claimed' => 'Item claimed',
                    'returned' => 'Item returned',
                    default => 'Post submitted',
                },
                'detail' => ($post['title'] ?: ucfirst($post['post_type'])).' at '.($post['location'] ?: 'an unknown location').'.',
                'time' => $post['created_at'],
                'icon' => match ($post['status']) {
                    'approved' => 'shield',
                    'rejected' => 'close',
                    'claimed' => 'clipboard',
                    'returned' => 'checkCircle',
                    default => 'document',
                },
            ])->all(),
            ...$claims->map(fn (Claim $claim) => [
                'id' => 'claim-'.$claim->id,
                'title' => match ($claim->status) {
                    'approved' => 'Claim approved',
                    'rejected' => 'Claim rejected',
                    'returned' => 'Item returned',
                    default => 'Claim submitted',
                },
                'detail' => ($claim->communityPost?->title ?: 'Found item claim').' is currently '.$claim->status.'.',
                'time' => optional($claim->updated_at ?? $claim->created_at)?->toISOString(),
                'icon' => 'clipboard',
            ])->all(),
            ...$receivedMessages->map(fn (Message $message) => [
                'id' => 'message-'.$message->id,
                'title' => 'Message received',
                'detail' => ($message->sender?->name ?: 'A user').' sent you a message.',
                'time' => optional($message->created_at)?->toISOString(),
                'icon' => 'chat',
            ])->all(),
        ])
            ->sortByDesc(fn (array $activity) => strtotime($activity['time'] ?? '1970-01-01'))
            ->take(8)
            ->values()
            ->all();

        $messagePreview = Message::query()
            ->with([
                'sender:id,name,email,profile_image',
                'receiver:id,name,email,profile_image',
            ])
            ->where(function ($query) use ($user) {
                $query
                    ->where('sender_id', $user->id)
                    ->orWhere('receiver_id', $user->id);
            })
            ->latest()
            ->get()
            ->groupBy(function (Message $message) use ($user) {
                return $message->sender_id === $user->id
                    ? $message->receiver_id
                    : $message->sender_id;
            })
            ->map(function ($items) use ($user) {
                /** @var Message $latest */
                $latest = $items->sortByDesc('created_at')->first();
                $participant = $latest->sender_id === $user->id
                    ? $latest->receiver
                    : $latest->sender;

                return [
                    'id' => $latest->id,
                    'sender' => $participant?->name ?: 'Unknown user',
                    'message' => $latest->message,
                    'time' => optional($latest->created_at)?->toISOString(),
                    'unread' => $items
                        ->where('receiver_id', $user->id)
                        ->where('is_read', false)
                        ->count() > 0,
                ];
            })
            ->sortByDesc(fn (array $message) => strtotime($message['time'] ?? '1970-01-01'))
            ->take(5)
            ->values();

        $notifications = UserNotification::query()
            ->where('recipient_user_id', $user->id)
            ->latest()
            ->limit(12)
            ->get()
            ->map(fn (UserNotification $notification) => $this->transformNotification($notification))
            ->values()
            ->all();

        return response()->json([
            'stats' => [
                'my_reported_items' => (clone $reportedPostsQuery)->count(),
                'pending_items' => (clone $reportedPostsQuery)->where('status', 'pending')->count(),
                'approved_items' => (clone $reportedPostsQuery)->where('status', 'approved')->count(),
                'my_claim_requests' => Claim::query()->where('user_id', $user->id)->count(),
                'messages' => Message::query()->where('receiver_id', $user->id)->where('is_read', false)->count(),
                'unread_notifications' => UserNotification::query()->where('recipient_user_id', $user->id)->whereNull('read_at')->count(),
                'returned_items' => CommunityPost::query()
                    ->where('user_id', $user->id)
                    ->whereIn('post_type', ['lost', 'found'])
                    ->where('status', 'returned')
                    ->count(),
            ],
            'recent_activity' => $activities,
            'recent_items' => $recentPosts,
            'messages_preview' => $messagePreview->all(),
            'notifications' => $notifications,
        ]);
    }

    protected function transformPost(CommunityPost $post): array
    {
        return [
            'id' => $post->id,
            'title' => $post->title,
            'post_type' => $post->post_type,
            'status' => $post->status,
            'content' => $post->content,
            'location' => $post->location,
            'item_date' => optional($post->item_date)?->format('Y-m-d'),
            'created_at' => optional($post->created_at)?->toISOString(),
            'image_url' => $post->image ? asset('storage/'.$post->image) : null,
            'category' => $post->category ? [
                'id' => $post->category->id,
                'name' => $post->category->name,
            ] : null,
        ];
    }

    protected function transformNotification(UserNotification $notification): array
    {
        return [
            'id' => $notification->id,
            'type' => $notification->type,
            'title' => $notification->title,
            'detail' => $notification->detail,
            'time' => optional($notification->created_at)?->toISOString(),
            'read' => $notification->read_at !== null,
            'read_at' => optional($notification->read_at)?->toISOString(),
            'data' => $notification->data ?? [],
        ];
    }
}
