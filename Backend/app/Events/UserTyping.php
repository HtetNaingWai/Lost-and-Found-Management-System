<?php

namespace App\Events;

use App\Support\RealtimeChannels;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserTyping implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public readonly int $senderId,
        public readonly int $receiverId,
        public readonly array $sender,
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel(RealtimeChannels::conversation($this->senderId, $this->receiverId)),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.typing';
    }

    public function broadcastWith(): array
    {
        return [
            'sender_id' => $this->senderId,
            'receiver_id' => $this->receiverId,
            'sender' => $this->sender,
        ];
    }
}
