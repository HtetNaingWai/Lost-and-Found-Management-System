<?php

namespace App\Http\Controllers;

use App\Events\MessageDeleted;
use App\Events\MessageRead;
use App\Events\MessageSent;
use App\Events\NotificationRead;
use App\Events\UserStoppedTyping;
use App\Events\UserTyping;
use App\Models\Claim;
use App\Models\CommunityPost;
use App\Models\ConversationDeletion;
use App\Models\Item;
use App\Models\Message;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\RealtimeBroadcaster;
use App\Services\WebhookDispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class MessageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $messages = Message::query()
            ->with($this->messageRelations())
            ->where(function ($query) use ($user) {
                $query
                    ->where('sender_id', $user->id)
                    ->orWhere('receiver_id', $user->id);
            })
            ->latest()
            ->get();

        $visibleMessages = $this->filterVisibleMessagesForUser($messages, $user);

        $conversations = $visibleMessages
            ->groupBy(fn (Message $message) => $this->conversationKey($message, $user))
            ->map(function ($items) use ($user) {
                /** @var Message $latest */
                $latest = $items->sortByDesc('created_at')->first();
                $participant = $latest->sender_id === $user->id
                    ? $latest->receiver
                    : $latest->sender;

                return [
                    'id' => $this->conversationKey($latest, $user),
                    'participant' => $participant ? $this->transformUser($participant) : null,
                    'community_post_id' => $latest->community_post_id,
                    'item_id' => $latest->item_id,
                    'related_item' => $this->transformRelatedItem($latest),
                    'latest_message' => $this->transformMessage($latest),
                    'unread_count' => $items
                        ->where('receiver_id', $user->id)
                        ->where('is_read', false)
                        ->whereNull('deleted_at')
                        ->count(),
                ];
            })
            ->filter(fn (array $conversation) => $conversation['participant'] !== null)
            ->sortByDesc(fn (array $conversation) => $conversation['latest_message']['created_at'])
            ->values();

        return response()->json([
            'conversations' => $conversations,
        ]);
    }

    public function show(Request $request, User $user): JsonResponse
    {
        $authUser = $request->user();

        abort_if($authUser->id === $user->id, 404);

        $context = $this->validatedContext($request);

        if (!$this->canOpenConversation($authUser, $user, $context)) {
            return response()->json([
                'message' => 'You can only open conversations connected to your message history or an item post.',
            ], Response::HTTP_FORBIDDEN);
        }

        $readMessages = $this->conversationQuery($authUser, $user, $context)
            ->where('sender_id', $user->id)
            ->where('receiver_id', $authUser->id)
            ->where('is_read', false)
            ->whereNull('deleted_at')
            ->get();

        $readMessageIds = $readMessages->pluck('id')->map(fn ($id) => (int) $id)->values()->all();

        if ($readMessageIds !== []) {
            Message::query()
                ->whereIn('id', $readMessageIds)
                ->update([
                    'is_read' => true,
                    'read_at' => now(),
                    'updated_at' => now(),
                ]);

            RealtimeBroadcaster::dispatch(new MessageRead(
                (int) $authUser->id,
                (int) $user->id,
                $readMessageIds,
                now()->toISOString(),
            ));
        }

        $notificationIds = \App\Models\UserNotification::query()
            ->where('recipient_user_id', $authUser->id)
            ->where('type', 'message_received')
            ->where('data->sender_id', $user->id)
            ->whereNull('read_at')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        if ($notificationIds !== []) {
            \App\Models\UserNotification::query()
                ->whereIn('id', $notificationIds)
                ->update([
                    'read_at' => now(),
                    'updated_at' => now(),
                ]);

            RealtimeBroadcaster::dispatch(new NotificationRead(
                (int) $authUser->id,
                $notificationIds,
                false,
                now()->toISOString(),
            ));
        }

        $messages = $this->filterVisibleMessagesForUser(
            $this->conversationQuery($authUser, $user, $context)
                ->with($this->messageRelations())
                ->oldest()
                ->get(),
            $authUser,
        )->map(fn (Message $message) => $this->transformMessage($message))->values();

        return response()->json([
            'id' => implode(':', [
                $user->id,
                $context['community_post_id'] ? 'post-'.$context['community_post_id'] : 'post-none',
                $context['item_id'] ? 'item-'.$context['item_id'] : 'item-none',
            ]),
            'participant' => $this->transformUser($user),
            'community_post_id' => $context['community_post_id'],
            'item_id' => $context['item_id'],
            'related_item' => $this->transformContextItem($context),
            'messages' => $messages,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'receiver_id' => ['required', 'exists:users,id', 'not_in:'.$request->user()->id],
            'message' => ['nullable', 'string', 'required_without:attachment'],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120', 'required_without:message'],
            'item_id' => ['nullable', 'exists:items,id'],
            'community_post_id' => ['nullable', 'exists:community_posts,id'],
        ]);

        $receiver = User::findOrFail($validated['receiver_id']);
        $context = [
            'community_post_id' => $validated['community_post_id'] ?? null,
            'item_id' => $validated['item_id'] ?? null,
        ];

        if (!$this->canOpenConversation($request->user(), $receiver, $context)) {
            return response()->json([
                'message' => 'You cannot message this user for that item.',
            ], Response::HTTP_FORBIDDEN);
        }

        $attachmentPath = null;

        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('message-attachments', 'public');
        }

        $message = Message::create([
            'sender_id' => $request->user()->id,
            'receiver_id' => $validated['receiver_id'],
            'item_id' => $validated['item_id'] ?? null,
            'community_post_id' => $validated['community_post_id'] ?? null,
            'message' => trim((string) ($validated['message'] ?? '')) ?: null,
            'attachment_path' => $attachmentPath,
            'attachment_type' => $request->file('attachment')?->getMimeType(),
            'attachment_name' => $request->file('attachment')?->getClientOriginalName(),
            'is_read' => false,
        ]);

        NotificationService::create(
            (int) $validated['receiver_id'],
            'message_received',
            'New message received',
            trim($request->user()->name.' sent you a new message.'),
            [
                'message_id' => $message->id,
                'sender_id' => $request->user()->id,
                'community_post_id' => $message->community_post_id,
                'item_id' => $message->item_id,
            ],
        );

        $messagePayload = $this->transformMessage($message->fresh($this->messageRelations()));

        RealtimeBroadcaster::dispatch(MessageSent::fromArray($messagePayload));

        WebhookDispatcher::dispatch('message_sent', [
            'message' => $messagePayload,
        ]);

        return response()->json([
            'message' => 'Message sent successfully.',
            'data' => $messagePayload,
        ], 201);
    }

    public function destroy(Request $request, Message $message): JsonResponse
    {
        abort_unless($message->sender_id === $request->user()->id, Response::HTTP_FORBIDDEN);

        if ($message->attachment_path) {
            Storage::disk('public')->delete($message->attachment_path);
        }

        $message->update([
            'message' => null,
            'attachment_path' => null,
            'attachment_type' => null,
            'attachment_name' => null,
            'deleted_at' => now(),
        ]);

        $payload = $this->transformMessage($message->fresh($this->messageRelations()));

        RealtimeBroadcaster::dispatch(new MessageDeleted(
            $payload,
            (int) $message->sender_id,
            (int) $message->receiver_id,
        ));

        return response()->json([
            'message' => 'Message deleted successfully.',
            'data' => $payload,
        ]);
    }

    public function destroyConversation(Request $request, User $user): JsonResponse
    {
        $authUser = $request->user();

        abort_if($authUser->id === $user->id, 404);

        $context = $this->validatedContext($request);

        ConversationDeletion::updateOrCreate(
            [
                'user_id' => $authUser->id,
                'participant_id' => $user->id,
                'community_post_id' => $context['community_post_id'],
                'item_id' => $context['item_id'],
            ],
            [
                'deleted_before' => now(),
            ],
        );

        return response()->json([
            'message' => 'Conversation removed from your inbox.',
        ]);
    }

    public function typing(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'receiver_id' => ['required', 'exists:users,id', 'not_in:'.$request->user()->id],
        ]);

        RealtimeBroadcaster::dispatch(new UserTyping(
            (int) $request->user()->id,
            (int) $validated['receiver_id'],
            $this->transformUser($request->user()),
        ));

        return response()->json([
            'message' => 'Typing state sent.',
        ]);
    }

    public function stopTyping(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'receiver_id' => ['required', 'exists:users,id', 'not_in:'.$request->user()->id],
        ]);

        RealtimeBroadcaster::dispatch(new UserStoppedTyping(
            (int) $request->user()->id,
            (int) $validated['receiver_id'],
        ));

        return response()->json([
            'message' => 'Typing stopped state sent.',
        ]);
    }

    protected function conversationQuery(User $firstUser, User $secondUser, array $context)
    {
        return Message::query()
            ->where(function ($query) use ($firstUser, $secondUser) {
                $query
                    ->where(function ($nested) use ($firstUser, $secondUser) {
                        $nested
                            ->where('sender_id', $firstUser->id)
                            ->where('receiver_id', $secondUser->id);
                    })
                    ->orWhere(function ($nested) use ($firstUser, $secondUser) {
                        $nested
                            ->where('sender_id', $secondUser->id)
                            ->where('receiver_id', $firstUser->id);
                    });
            })
            ->when(
                $context['community_post_id'],
                fn ($query) => $query->where('community_post_id', $context['community_post_id']),
                fn ($query) => $query->whereNull('community_post_id'),
            )
            ->when(
                $context['item_id'],
                fn ($query) => $query->where('item_id', $context['item_id']),
                fn ($query) => $query->whereNull('item_id'),
            );
    }

    protected function validatedContext(Request $request): array
    {
        $validated = $request->validate([
            'community_post_id' => ['nullable', 'exists:community_posts,id'],
            'item_id' => ['nullable', 'exists:items,id'],
        ]);

        return [
            'community_post_id' => $validated['community_post_id'] ?? null,
            'item_id' => $validated['item_id'] ?? null,
        ];
    }

    protected function canOpenConversation(User $authUser, User $participant, array $context): bool
    {
        if ($context['community_post_id']) {
            $post = CommunityPost::query()->find($context['community_post_id']);
            if (!$post) return false;

            if (in_array($post->user_id, [$authUser->id, $participant->id], true)) {
                return true;
            }

            return Claim::query()
                ->where('community_post_id', $post->id)
                ->whereIn('user_id', [$authUser->id, $participant->id])
                ->exists();
        }

        if ($context['item_id']) {
            $item = Item::query()->find($context['item_id']);
            if (!$item) return false;

            return in_array($item->user_id, [$authUser->id, $participant->id], true);
        }

        return Message::query()
            ->where(function ($query) use ($authUser, $participant) {
                $query
                    ->where('sender_id', $authUser->id)
                    ->where('receiver_id', $participant->id);
            })
            ->orWhere(function ($query) use ($authUser, $participant) {
                $query
                    ->where('sender_id', $participant->id)
                    ->where('receiver_id', $authUser->id);
            })
            ->exists();
    }

    protected function filterVisibleMessagesForUser($messages, User $user)
    {
        $deletions = ConversationDeletion::query()
            ->where('user_id', $user->id)
            ->get();

        return $messages->filter(function (Message $message) use ($deletions, $user) {
            $participantId = $message->sender_id === $user->id ? $message->receiver_id : $message->sender_id;

            $deletion = $deletions->first(fn (ConversationDeletion $entry) => (
                (int) $entry->participant_id === (int) $participantId
                && (int) ($entry->community_post_id ?? 0) === (int) ($message->community_post_id ?? 0)
                && (int) ($entry->item_id ?? 0) === (int) ($message->item_id ?? 0)
            ));

            return !$deletion || $message->created_at->gt($deletion->deleted_before);
        });
    }

    protected function conversationKey(Message $message, User $user): string
    {
        $participantId = $message->sender_id === $user->id ? $message->receiver_id : $message->sender_id;

        return implode(':', [
            $participantId,
            $message->community_post_id ? 'post-'.$message->community_post_id : 'post-none',
            $message->item_id ? 'item-'.$message->item_id : 'item-none',
        ]);
    }

    protected function transformMessage(Message $message): array
    {
        $isDeleted = $message->deleted_at !== null;

        return [
            'id' => $message->id,
            'message' => $isDeleted ? null : $message->message,
            'is_read' => $message->is_read,
            'read_at' => optional($message->read_at)?->toISOString(),
            'is_deleted' => $isDeleted,
            'deleted_at' => optional($message->deleted_at)?->toISOString(),
            'item_id' => $message->item_id,
            'community_post_id' => $message->community_post_id,
            'attachment_url' => !$isDeleted && $message->attachment_path ? asset('storage/'.$message->attachment_path) : null,
            'attachment_type' => $isDeleted ? null : $message->attachment_type,
            'attachment_name' => $isDeleted ? null : $message->attachment_name,
            'related_item' => $this->transformRelatedItem($message),
            'created_at' => optional($message->created_at)?->toISOString(),
            'sender' => $message->sender ? $this->transformUser($message->sender) : null,
            'receiver' => $message->receiver ? $this->transformUser($message->receiver) : null,
        ];
    }

    protected function transformRelatedItem(Message $message): ?array
    {
        if ($message->communityPost) {
            return $this->transformCommunityPost($message->communityPost);
        }

        if ($message->item) {
            return $this->transformItem($message->item);
        }

        return null;
    }

    protected function transformContextItem(array $context): ?array
    {
        if ($context['community_post_id']) {
            $post = CommunityPost::query()
                ->with(['user:id,name,email,profile_image', 'category:id,name', 'claims.user:id,name,email,profile_image'])
                ->find($context['community_post_id']);

            return $post ? $this->transformCommunityPost($post) : null;
        }

        if ($context['item_id']) {
            $item = Item::query()
                ->with(['user:id,name,email,profile_image', 'category:id,name'])
                ->find($context['item_id']);

            return $item ? $this->transformItem($item) : null;
        }

        return null;
    }

    protected function transformCommunityPost(CommunityPost $post): array
    {
        return [
            'id' => $post->id,
            'post_type' => $post->post_type,
            'type' => $post->post_type,
            'title' => $post->title,
            'content' => $post->content,
            'description' => $post->content,
            'category' => $post->category ? ['id' => $post->category->id, 'name' => $post->category->name] : null,
            'location' => $post->location,
            'latitude' => $post->latitude !== null ? (float) $post->latitude : null,
            'longitude' => $post->longitude !== null ? (float) $post->longitude : null,
            'item_date' => optional($post->item_date)?->format('Y-m-d'),
            'status' => $post->status,
            'returned_at' => optional($post->returned_at)?->toISOString(),
            'image_url' => $post->image ? asset('storage/'.$post->image) : null,
            'user' => $post->user ? $this->transformUser($post->user) : null,
            'claims' => $post->relationLoaded('claims')
                ? $post->claims->map(fn (Claim $claim) => [
                    'id' => $claim->id,
                    'status' => $claim->status,
                    'user' => $claim->user ? $this->transformUser($claim->user) : null,
                ])->values()->all()
                : [],
        ];
    }

    protected function transformItem(Item $item): array
    {
        return [
            'id' => $item->id,
            'post_type' => $item->type,
            'type' => $item->type,
            'title' => $item->title,
            'content' => $item->description,
            'description' => $item->description,
            'category' => $item->category ? ['id' => $item->category->id, 'name' => $item->category->name] : null,
            'location' => $item->location,
            'latitude' => $item->latitude !== null ? (float) $item->latitude : null,
            'longitude' => $item->longitude !== null ? (float) $item->longitude : null,
            'item_date' => optional($item->item_date)?->format('Y-m-d'),
            'status' => $item->status,
            'returned_at' => optional($item->returned_at)?->toISOString(),
            'image_url' => $item->image ? asset('storage/'.$item->image) : null,
            'user' => $item->user ? $this->transformUser($item->user) : null,
            'claims' => [],
        ];
    }

    protected function transformUser(User $user): array
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

    protected function messageRelations(): array
    {
        return [
            'sender:id,name,email,profile_image',
            'receiver:id,name,email,profile_image',
            'item.user:id,name,email,profile_image',
            'item.category:id,name',
            'communityPost.user:id,name,email,profile_image',
            'communityPost.category:id,name',
            'communityPost.claims.user:id,name,email,profile_image',
        ];
    }
}
