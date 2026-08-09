<?php

namespace App\Services;

use App\Jobs\SendWebhookJob;
use App\Models\WebhookDelivery;
use App\Models\WebhookEndpoint;

class WebhookDispatcher
{
    public const SUPPORTED_EVENTS = [
        'post_created',
        'post_approved',
        'post_rejected',
        'claim_created',
        'claim_approved',
        'claim_rejected',
        'item_returned',
        'message_sent',
    ];

    /**
     * @param array<string, mixed> $payload
     */
    public static function dispatch(string $eventName, array $payload): void
    {
        $endpoints = WebhookEndpoint::query()
            ->where('status', 'active')
            ->whereJsonContains('events', $eventName)
            ->get();

        foreach ($endpoints as $endpoint) {
            self::queueDelivery($endpoint, $eventName, $payload);
        }
    }

    /**
     * @param array<string, mixed> $payload
     */
    public static function dispatchToEndpoint(WebhookEndpoint $endpoint, string $eventName, array $payload): WebhookDelivery
    {
        return self::queueDelivery($endpoint, $eventName, $payload);
    }

    /**
     * @param array<string, mixed> $payload
     */
    protected static function queueDelivery(WebhookEndpoint $endpoint, string $eventName, array $payload): WebhookDelivery
    {
        $delivery = WebhookDelivery::create([
            'webhook_endpoint_id' => $endpoint->id,
            'event_name' => $eventName,
            'payload' => $payload,
            'attempts' => 0,
        ]);

        SendWebhookJob::dispatch($delivery->id);

        return $delivery;
    }
}
