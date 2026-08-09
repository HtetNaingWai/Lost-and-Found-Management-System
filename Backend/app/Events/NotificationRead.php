<?php

namespace App\Events;

use App\Support\RealtimeChannels;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationRead implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    /**
     * @param list<int> $notificationIds
     */
    public function __construct(
        public readonly int $recipientUserId,
        public readonly array $notificationIds = [],
        public readonly bool $all = false,
        public readonly ?string $readAt = null,
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
        return 'notification.read';
    }

    public function broadcastWith(): array
    {
        return [
            'notification_ids' => $this->notificationIds,
            'all' => $this->all,
            'read_at' => $this->readAt,
        ];
    }
}
