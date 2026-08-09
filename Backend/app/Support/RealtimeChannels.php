<?php

namespace App\Support;

class RealtimeChannels
{
    public static function user(int $userId): string
    {
        return 'user.'.$userId;
    }

    public static function conversation(int $firstUserId, int $secondUserId): string
    {
        $ids = [(int) $firstUserId, (int) $secondUserId];
        sort($ids);

        return 'conversation.'.$ids[0].'.'.$ids[1];
    }

    public static function presenceMessaging(): string
    {
        return 'messaging';
    }
}
