<?php

namespace App\Jobs;

use App\Models\WebhookDelivery;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class SendWebhookJob implements ShouldQueue
{
    use InteractsWithQueue;
    use Queueable;

    public int $tries = 3;

    public function __construct(
        public readonly int $deliveryId,
    ) {
    }

    public function backoff(): array
    {
        return [10, 60, 180];
    }

    public function handle(): void
    {
        $delivery = WebhookDelivery::query()
            ->with('endpoint')
            ->findOrFail($this->deliveryId);

        $endpoint = $delivery->endpoint;

        if (! $endpoint || $endpoint->status !== 'active') {
            return;
        }

        $timestamp = now()->toISOString();
        $signature = hash_hmac('sha256', $timestamp.'.'.json_encode($delivery->payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), $endpoint->secret);

        $headers = [
            'X-FindIt-Event' => $delivery->event_name,
            'X-FindIt-Delivery' => (string) $delivery->id,
            'X-FindIt-Timestamp' => $timestamp,
            'X-FindIt-Signature' => $signature,
        ];

        $delivery->forceFill([
            'headers' => $headers,
            'attempts' => $this->attempts(),
            'last_attempt_at' => now(),
            'error_message' => null,
        ])->save();

        $response = Http::timeout(15)
            ->acceptJson()
            ->withHeaders($headers)
            ->post($endpoint->url, [
                'event' => $delivery->event_name,
                'event_id' => (string) $delivery->id,
                'occurred_at' => $timestamp,
                'data' => $delivery->payload,
            ]);

        $delivery->forceFill([
            'response_status' => $response->status(),
            'response_body' => mb_substr($response->body(), 0, 10000),
            'delivered_at' => $response->successful() ? now() : null,
        ])->save();

        if (! $response->successful()) {
            throw new RuntimeException('Webhook delivery failed with status '.$response->status().'.');
        }
    }

    public function failed(?Throwable $exception): void
    {
        $delivery = WebhookDelivery::query()->find($this->deliveryId);

        if (! $delivery) {
            return;
        }

        $delivery->forceFill([
            'failed_at' => now(),
            'attempts' => max($delivery->attempts ?? 0, $this->tries),
            'error_message' => $exception?->getMessage(),
        ])->save();
    }
}
