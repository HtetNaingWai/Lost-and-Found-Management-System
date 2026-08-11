<?php

namespace App\Http\Controllers;

use App\Events\MessageRead;
use App\Events\MessageDeleted;
use App\Events\MessageSent;
use App\Events\UserStoppedTyping;
use App\Events\UserTyping;
use App\Models\Message;
use App\Models\SupportConversation;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\RealtimeBroadcaster;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class SupportConversationController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $conversation = $this->findOrCreateConversation($request->user());

        $this->markMessagesRead($conversation, $request->user());

        return response()->json([
            'conversation' => $this->transformConversation($conversation->fresh($this->conversationRelations()), $request->user()),
            'messages' => $this->conversationMessages($conversation),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['nullable', 'string', 'max:5000', 'required_without:attachment'],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120', 'required_without:message'],
        ]);

        $conversation = $this->findOrCreateConversation($request->user());
        $admin = $conversation->admin ?? $this->supportAdmin();

        abort_if(!$admin, Response::HTTP_NOT_FOUND, 'No support admin is available yet.');

        if ($conversation->admin_id !== $admin->id || $conversation->status === 'resolved') {
            $conversation->update([
                'admin_id' => $admin->id,
                'status' => 'open',
                'resolved_at' => null,
            ]);
        }

        $attachmentPath = null;

        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('message-attachments', 'public');
        }

        $message = Message::create([
            'sender_id' => $request->user()->id,
            'receiver_id' => $admin->id,
            'support_conversation_id' => $conversation->id,
            'message' => trim((string) ($validated['message'] ?? '')) ?: null,
            'attachment_path' => $attachmentPath,
            'attachment_type' => $request->file('attachment')?->getMimeType(),
            'attachment_name' => $request->file('attachment')?->getClientOriginalName(),
            'is_read' => false,
        ]);

        NotificationService::create(
            $admin->id,
            'support_message_received',
            'New support message',
            $request->user()->name.' sent a support message.',
            [
                'support_conversation_id' => $conversation->id,
                'sender_id' => $request->user()->id,
                'route' => '/admin/contact-messages',
            ],
        );

        $payload = $this->transformMessage($message->fresh($this->messageRelations()));

        RealtimeBroadcaster::dispatch(MessageSent::fromArray($payload));

        return response()->json([
            'message' => 'Support message sent successfully.',
            'data' => $payload,
            'conversation' => $this->transformConversation($conversation->fresh($this->conversationRelations()), $request->user()),
        ], Response::HTTP_CREATED);
    }

    public function adminIndex(Request $request): JsonResponse
    {
        $conversations = SupportConversation::query()
            ->with($this->conversationRelations())
            ->withCount([
                'messages as unread_count' => fn ($query) => $query
                    ->where('receiver_id', $request->user()->id)
                    ->where('is_read', false),
            ])
            ->latest('updated_at')
            ->get()
            ->map(fn (SupportConversation $conversation) => $this->transformConversation($conversation, $request->user()))
            ->values();

        return response()->json([
            'conversations' => $conversations,
        ]);
    }

    public function adminShow(Request $request, SupportConversation $supportConversation): JsonResponse
    {
        $this->markMessagesRead($supportConversation, $request->user());

        return response()->json([
            'conversation' => $this->transformConversation($supportConversation->fresh($this->conversationRelations()), $request->user()),
            'messages' => $this->conversationMessages($supportConversation),
        ]);
    }

    public function adminStore(Request $request, SupportConversation $supportConversation): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['nullable', 'string', 'max:5000', 'required_without:attachment'],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120', 'required_without:message'],
        ]);

        $supportConversation->update([
            'admin_id' => $request->user()->id,
            'status' => 'in_progress',
            'resolved_at' => $supportConversation->status === 'resolved' ? null : $supportConversation->resolved_at,
        ]);

        $attachmentPath = null;

        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('message-attachments', 'public');
        }

        $message = Message::create([
            'sender_id' => $request->user()->id,
            'receiver_id' => $supportConversation->user_id,
            'support_conversation_id' => $supportConversation->id,
            'message' => trim((string) ($validated['message'] ?? '')) ?: null,
            'attachment_path' => $attachmentPath,
            'attachment_type' => $request->file('attachment')?->getMimeType(),
            'attachment_name' => $request->file('attachment')?->getClientOriginalName(),
            'is_read' => false,
        ]);

        NotificationService::create(
            $supportConversation->user_id,
            'support_reply_received',
            'Support replied',
            'FindIt Admin replied to your support conversation.',
            [
                'support_conversation_id' => $supportConversation->id,
                'sender_id' => $request->user()->id,
                'route' => '/contact',
            ],
        );

        $payload = $this->transformMessage($message->fresh($this->messageRelations()));

        RealtimeBroadcaster::dispatch(MessageSent::fromArray($payload));

        return response()->json([
            'message' => 'Reply sent successfully.',
            'data' => $payload,
            'conversation' => $this->transformConversation($supportConversation->fresh($this->conversationRelations()), $request->user()),
        ], Response::HTTP_CREATED);
    }

    public function adminStoreForUser(Request $request, User $user): JsonResponse
    {
        abort_if($user->role === 'admin', Response::HTTP_UNPROCESSABLE_ENTITY, 'Choose a community member to message.');

        $conversation = SupportConversation::firstOrCreate(
            [
                'user_id' => $user->id,
                'type' => 'support',
            ],
            [
                'admin_id' => $request->user()->id,
                'status' => 'open',
            ],
        );

        return $this->adminStore($request, $conversation);
    }

    public function destroyMessage(Request $request, Message $message): JsonResponse
    {
        abort_unless($message->support_conversation_id, Response::HTTP_NOT_FOUND);
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

    public function adminResolve(Request $request, SupportConversation $supportConversation): JsonResponse
    {
        $supportConversation->update([
            'admin_id' => $request->user()->id,
            'status' => 'resolved',
            'resolved_at' => now(),
        ]);

        NotificationService::create(
            $supportConversation->user_id,
            'support_conversation_resolved',
            'Support conversation resolved',
            'FindIt Admin marked your support conversation as resolved.',
            [
                'support_conversation_id' => $supportConversation->id,
                'route' => '/contact',
            ],
        );

        return response()->json([
            'message' => 'Support conversation marked as resolved.',
            'conversation' => $this->transformConversation($supportConversation->fresh($this->conversationRelations()), $request->user()),
        ]);
    }

    public function typing(Request $request): JsonResponse
    {
        $conversation = $this->findOrCreateConversation($request->user());
        $receiverId = $conversation->admin_id;

        abort_if(!$receiverId, Response::HTTP_NOT_FOUND, 'No support admin is available yet.');

        RealtimeBroadcaster::dispatch(new UserTyping(
            (int) $request->user()->id,
            (int) $receiverId,
            $this->transformUser($request->user()),
        ));

        return response()->json(['message' => 'Typing state sent.']);
    }

    public function stopTyping(Request $request): JsonResponse
    {
        $conversation = $this->findOrCreateConversation($request->user());
        $receiverId = $conversation->admin_id;

        abort_if(!$receiverId, Response::HTTP_NOT_FOUND, 'No support admin is available yet.');

        RealtimeBroadcaster::dispatch(new UserStoppedTyping((int) $request->user()->id, (int) $receiverId));

        return response()->json(['message' => 'Typing stopped state sent.']);
    }

    public function adminTyping(Request $request, SupportConversation $supportConversation): JsonResponse
    {
        RealtimeBroadcaster::dispatch(new UserTyping(
            (int) $request->user()->id,
            (int) $supportConversation->user_id,
            $this->transformUser($request->user()),
        ));

        return response()->json(['message' => 'Typing state sent.']);
    }

    public function adminStopTyping(Request $request, SupportConversation $supportConversation): JsonResponse
    {
        RealtimeBroadcaster::dispatch(new UserStoppedTyping((int) $request->user()->id, (int) $supportConversation->user_id));

        return response()->json(['message' => 'Typing stopped state sent.']);
    }

    protected function findOrCreateConversation(User $user): SupportConversation
    {
        $admin = $this->supportAdmin();

        return SupportConversation::firstOrCreate(
            [
                'user_id' => $user->id,
                'type' => 'support',
            ],
            [
                'admin_id' => $admin?->id,
                'status' => 'open',
            ],
        )->load($this->conversationRelations());
    }

    protected function supportAdmin(): ?User
    {
        return User::query()
            ->where('role', 'admin')
            ->where('status', 'active')
            ->oldest()
            ->first()
            ?? User::query()->where('role', 'admin')->oldest()->first();
    }

    protected function markMessagesRead(SupportConversation $conversation, User $reader): void
    {
        $messageIds = Message::query()
            ->where('support_conversation_id', $conversation->id)
            ->where('receiver_id', $reader->id)
            ->where('is_read', false)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        if ($messageIds === []) {
            return;
        }

        Message::query()
            ->whereIn('id', $messageIds)
            ->update([
                'is_read' => true,
                'read_at' => now(),
                'updated_at' => now(),
            ]);

        $otherUserId = (int) ($conversation->user_id === $reader->id
            ? $conversation->admin_id
            : $conversation->user_id);

        if ($otherUserId) {
            RealtimeBroadcaster::dispatch(new MessageRead(
                (int) $reader->id,
                $otherUserId,
                $messageIds,
                now()->toISOString(),
            ));
        }
    }

    protected function conversationMessages(SupportConversation $conversation)
    {
        return Message::query()
            ->with($this->messageRelations())
            ->where('support_conversation_id', $conversation->id)
            ->oldest()
            ->get()
            ->map(fn (Message $message) => $this->transformMessage($message))
            ->values();
    }

    protected function transformConversation(SupportConversation $conversation, User $viewer): array
    {
        $latest = $conversation->messages->sortByDesc('created_at')->first();
        $participant = $viewer->role === 'admin' ? $conversation->user : $conversation->admin;

        return [
            'id' => $conversation->id,
            'type' => $conversation->type,
            'status' => $conversation->status,
            'resolved_at' => optional($conversation->resolved_at)?->toISOString(),
            'user' => $conversation->user ? $this->transformUser($conversation->user) : null,
            'admin' => $conversation->admin ? $this->transformUser($conversation->admin) : null,
            'participant' => $participant ? $this->transformUser($participant) : null,
            'latest_message' => $latest ? $this->transformMessage($latest) : null,
            'unread_count' => (int) ($conversation->unread_count ?? $conversation->messages
                ->where('receiver_id', $viewer->id)
                ->where('is_read', false)
                ->count()),
            'created_at' => optional($conversation->created_at)?->toISOString(),
            'updated_at' => optional($conversation->updated_at)?->toISOString(),
        ];
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
            'support_conversation_id' => $message->support_conversation_id,
            'created_at' => optional($message->created_at)?->toISOString(),
            'sender' => $message->sender ? $this->transformUser($message->sender) : null,
            'receiver' => $message->receiver ? $this->transformUser($message->receiver) : null,
            'related_item' => null,
            'item_id' => null,
            'community_post_id' => null,
            'attachment_url' => !$isDeleted && $message->attachment_path ? asset('storage/'.$message->attachment_path) : null,
            'attachment_type' => $isDeleted ? null : $message->attachment_type,
            'attachment_name' => $isDeleted ? null : $message->attachment_name,
        ];
    }

    protected function transformUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'profile_image_url' => $user->profile_image ? asset('storage/'.$user->profile_image) : null,
            ...$user->presencePayload(),
        ];
    }

    protected function conversationRelations(): array
    {
        return [
            'user:id,name,email,profile_image,status,is_online,last_seen_at',
            'admin:id,name,email,profile_image,status,is_online,last_seen_at',
            'messages.sender:id,name,email,profile_image,is_online,last_seen_at',
            'messages.receiver:id,name,email,profile_image,is_online,last_seen_at',
        ];
    }

    protected function messageRelations(): array
    {
        return [
            'sender:id,name,email,profile_image,is_online,last_seen_at',
            'receiver:id,name,email,profile_image,is_online,last_seen_at',
        ];
    }
}
