<?php

namespace App\Events;

use App\Support\RealtimeChannels;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public function __construct(
        public readonly array $message,
        public readonly int $senderId,
        public readonly int $receiverId,
    ) {
    }

    public static function fromArray(array $message): self
    {
        return new self(
            $message,
            (int) ($message['sender']['id'] ?? 0),
            (int) ($message['receiver']['id'] ?? 0),
        );
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel(RealtimeChannels::conversation($this->senderId, $this->receiverId)),
            new PrivateChannel(RealtimeChannels::user($this->senderId)),
            new PrivateChannel(RealtimeChannels::user($this->receiverId)),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        return [
            'message' => $this->message,
            'sender_id' => $this->senderId,
            'receiver_id' => $this->receiverId,
        ];
    }
}
