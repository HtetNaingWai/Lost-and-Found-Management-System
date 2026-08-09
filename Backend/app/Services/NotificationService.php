<?php

namespace App\Services;

use App\Events\NotificationCreated;
use App\Models\UserNotification;

class NotificationService
{
    /**
     * @param array<string, mixed> $data
     */
    public static function create(
        int $recipientUserId,
        string $type,
        string $title,
        ?string $detail = null,
        array $data = [],
    ): UserNotification {
        $notification = UserNotification::create([
            'recipient_user_id' => $recipientUserId,
            'type' => $type,
            'title' => $title,
            'detail' => $detail,
            'data' => $data ?: null,
        ]);

        event(new NotificationCreated($recipientUserId, self::transform($notification)));

        return $notification;
    }

    public static function transform(UserNotification $notification): array
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
