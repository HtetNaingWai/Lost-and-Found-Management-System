<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $messages = Message::query()
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
            ->get();

        $conversations = $messages
            ->groupBy(function (Message $message) use ($user) {
                return $message->sender_id === $user->id
                    ? $message->receiver_id
                    : $message->sender_id;
            })
            ->map(function ($items, $participantId) use ($user) {
                /** @var Message $latest */
                $latest = $items->sortByDesc('created_at')->first();
                $participant = $latest->sender_id === $user->id
                    ? $latest->receiver
                    : $latest->sender;

                return [
                    'participant' => $participant ? $this->transformUser($participant) : null,
                    'latest_message' => $this->transformMessage($latest),
                    'unread_count' => $items
                        ->where('receiver_id', $user->id)
                        ->where('is_read', false)
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

        Message::query()
            ->where('sender_id', $user->id)
            ->where('receiver_id', $authUser->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        $messages = Message::query()
            ->with([
                'sender:id,name,email,profile_image',
                'receiver:id,name,email,profile_image',
            ])
            ->where(function ($query) use ($authUser, $user) {
                $query
                    ->where('sender_id', $authUser->id)
                    ->where('receiver_id', $user->id);
            })
            ->orWhere(function ($query) use ($authUser, $user) {
                $query
                    ->where('sender_id', $user->id)
                    ->where('receiver_id', $authUser->id);
            })
            ->oldest()
            ->get()
            ->map(fn (Message $message) => $this->transformMessage($message));

        return response()->json([
            'participant' => $this->transformUser($user),
            'messages' => $messages,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'receiver_id' => ['required', 'exists:users,id', 'not_in:' . $request->user()->id],
            'message' => ['required', 'string'],
            'item_id' => ['nullable', 'exists:items,id'],
        ]);

        $message = Message::create([
            'sender_id' => $request->user()->id,
            'receiver_id' => $validated['receiver_id'],
            'item_id' => $validated['item_id'] ?? null,
            'message' => $validated['message'],
            'is_read' => false,
        ]);

        return response()->json([
            'message' => 'Message sent successfully.',
            'data' => $this->transformMessage($message->fresh([
                'sender:id,name,email,profile_image',
                'receiver:id,name,email,profile_image',
            ])),
        ], 201);
    }

    protected function transformMessage(Message $message): array
    {
        return [
            'id' => $message->id,
            'message' => $message->message,
            'is_read' => $message->is_read,
            'item_id' => $message->item_id,
            'created_at' => optional($message->created_at)?->toISOString(),
            'sender' => $message->sender ? $this->transformUser($message->sender) : null,
            'receiver' => $message->receiver ? $this->transformUser($message->receiver) : null,
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
}
