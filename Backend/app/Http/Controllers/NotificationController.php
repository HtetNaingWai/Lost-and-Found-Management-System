<?php

namespace App\Http\Controllers;

use App\Events\NotificationRead;
use App\Models\User;
use App\Models\UserNotification;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $notifications = UserNotification::query()
            ->where('recipient_user_id', $user->id)
            ->latest()
            ->limit(20)
            ->get();

        return response()->json([
            'notifications' => $notifications->map(fn (UserNotification $notification) => $this->transformNotification($notification))->values()->all(),
            'unread_count' => $notifications->whereNull('read_at')->count(),
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        UserNotification::query()
            ->where('recipient_user_id', $user->id)
            ->whereNull('read_at')
            ->update([
                'read_at' => now(),
                'updated_at' => now(),
            ]);

        event(new NotificationRead($user->id, [], true, now()->toISOString()));

        return response()->json([
            'message' => 'Notifications marked as read.',
        ]);
    }

    public function markRead(Request $request, UserNotification $notification): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless($notification->recipient_user_id === $user->id, 404);

        if (! $notification->read_at) {
            $notification->forceFill([
                'read_at' => now(),
            ])->save();

            event(new NotificationRead($user->id, [$notification->id], false, optional($notification->read_at)?->toISOString()));
        }

        return response()->json([
            'message' => 'Notification marked as read.',
            'notification' => NotificationService::transform($notification->fresh()),
        ]);
    }

    protected function transformNotification(UserNotification $notification): array
    {
        return NotificationService::transform($notification);
    }
}
