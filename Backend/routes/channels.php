<?php

use App\Support\RealtimeChannels;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('user.{userId}', function ($user, int $userId) {
    return (int) $user->id === $userId;
});

Broadcast::channel('conversation.{leftUserId}.{rightUserId}', function ($user, int $leftUserId, int $rightUserId) {
    return in_array((int) $user->id, [$leftUserId, $rightUserId], true);
});

Broadcast::channel('messaging', function ($user) {
    return [
        'id' => $user->id,
        'name' => $user->name,
        'profile_image_url' => $user->profile_image
            ? asset('storage/'.$user->profile_image)
            : null,
        ...$user->presencePayload(),
    ];
});
