<?php

namespace App\Events;

use App\Support\RealtimeChannels;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageRead implements ShouldBroadcastNow
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    /**
     * @param list<int> $messageIds
     */
    public function __construct(
        public readonly int $readerId,
        public readonly int $participantId,
        public readonly array $messageIds,
        public readonly string $readAt,
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel(RealtimeChannels::conversation($this->readerId, $this->participantId)),
            new PrivateChannel(RealtimeChannels::user($this->readerId)),
            new PrivateChannel(RealtimeChannels::user($this->participantId)),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.read';
    }

    public function broadcastWith(): array
    {
        return [
            'reader_id' => $this->readerId,
            'participant_id' => $this->participantId,
            'message_ids' => $this->messageIds,
            'read_at' => $this->readAt,
        ];
    }
}
