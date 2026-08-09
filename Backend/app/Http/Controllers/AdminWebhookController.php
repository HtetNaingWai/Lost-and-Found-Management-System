<?php

namespace App\Http\Controllers;

use App\Models\WebhookDelivery;
use App\Models\WebhookEndpoint;
use App\Services\WebhookDispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminWebhookController extends Controller
{
    public function index(): JsonResponse
    {
        $endpoints = WebhookEndpoint::query()
            ->with(['deliveries' => fn ($query) => $query->latest()->limit(5)])
            ->latest()
            ->get();

        return response()->json([
            'supported_events' => WebhookDispatcher::SUPPORTED_EVENTS,
            'endpoints' => $endpoints->map(fn (WebhookEndpoint $endpoint) => $this->transformEndpoint($endpoint))->values()->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'url' => ['required', 'url', 'max:2048'],
            'secret' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
            'events' => ['required', 'array', 'min:1'],
            'events.*' => ['required', Rule::in(WebhookDispatcher::SUPPORTED_EVENTS)],
        ]);

        $endpoint = WebhookEndpoint::create([
            'name' => $validated['name'],
            'url' => $validated['url'],
            'secret' => $validated['secret'] ?: Str::random(40),
            'status' => $validated['status'] ?? 'active',
            'events' => array_values(array_unique($validated['events'])),
        ]);

        return response()->json([
            'message' => 'Webhook endpoint created successfully.',
            'endpoint' => $this->transformEndpoint($endpoint->fresh(['deliveries'])),
        ], 201);
    }

    public function update(Request $request, WebhookEndpoint $webhook): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'url' => ['sometimes', 'url', 'max:2048'],
            'secret' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
            'events' => ['sometimes', 'array', 'min:1'],
            'events.*' => ['required_with:events', Rule::in(WebhookDispatcher::SUPPORTED_EVENTS)],
        ]);

        if (array_key_exists('events', $validated)) {
            $validated['events'] = array_values(array_unique($validated['events']));
        }

        $webhook->update($validated);

        return response()->json([
            'message' => 'Webhook endpoint updated successfully.',
            'endpoint' => $this->transformEndpoint($webhook->fresh(['deliveries' => fn ($query) => $query->latest()->limit(5)])),
        ]);
    }

    public function destroy(WebhookEndpoint $webhook): JsonResponse
    {
        $webhook->delete();

        return response()->json([
            'message' => 'Webhook endpoint deleted successfully.',
        ]);
    }

    public function deliveries(WebhookEndpoint $webhook): JsonResponse
    {
        $deliveries = $webhook->deliveries()
            ->latest()
            ->limit(25)
            ->get();

        return response()->json([
            'deliveries' => $deliveries->map(fn (WebhookDelivery $delivery) => $this->transformDelivery($delivery))->values()->all(),
        ]);
    }

    public function test(WebhookEndpoint $webhook): JsonResponse
    {
        $delivery = WebhookDispatcher::dispatchToEndpoint($webhook, 'webhook.test', [
            'message' => 'Test webhook from FindIt.',
            'endpoint_id' => $webhook->id,
        ]);

        return response()->json([
            'message' => 'Test webhook queued successfully.',
            'delivery' => $this->transformDelivery($delivery->fresh()),
        ]);
    }

    protected function transformEndpoint(WebhookEndpoint $endpoint): array
    {
        return [
            'id' => $endpoint->id,
            'name' => $endpoint->name,
            'url' => $endpoint->url,
            'secret' => $endpoint->secret,
            'status' => $endpoint->status,
            'events' => $endpoint->events ?? [],
            'created_at' => optional($endpoint->created_at)?->toISOString(),
            'updated_at' => optional($endpoint->updated_at)?->toISOString(),
            'deliveries' => $endpoint->relationLoaded('deliveries')
                ? $endpoint->deliveries->map(fn (WebhookDelivery $delivery) => $this->transformDelivery($delivery))->values()->all()
                : [],
        ];
    }

    protected function transformDelivery(WebhookDelivery $delivery): array
    {
        return [
            'id' => $delivery->id,
            'event_name' => $delivery->event_name,
            'payload' => $delivery->payload ?? [],
            'headers' => $delivery->headers ?? [],
            'response_status' => $delivery->response_status,
            'response_body' => $delivery->response_body,
            'attempts' => $delivery->attempts,
            'last_attempt_at' => optional($delivery->last_attempt_at)?->toISOString(),
            'delivered_at' => optional($delivery->delivered_at)?->toISOString(),
            'failed_at' => optional($delivery->failed_at)?->toISOString(),
            'error_message' => $delivery->error_message,
            'created_at' => optional($delivery->created_at)?->toISOString(),
        ];
    }
}
