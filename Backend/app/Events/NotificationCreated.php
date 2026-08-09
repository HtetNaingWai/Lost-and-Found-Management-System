<?php

namespace App\Events;

use App\Support\RealtimeChannels;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationCreated implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public readonly int $recipientUserId,
        public readonly array $notification,
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel(RealtimeChannels::user($this->recipientUserId)),
        ];
    }

    public function broadcastAs(): string
    {
        return 'notification.created';
    }

    public function broadcastWith(): array
    {
        return [
            'notification' => $this->notification,
        ];
    }
}
