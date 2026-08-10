<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Throwable;

class RealtimeBroadcaster
{
    public static function dispatch(object $event): void
    {
        try {
            event($event);
        } catch (Throwable $exception) {
            Log::warning('Realtime broadcast skipped.', [
                'event' => $event::class,
                'message' => $exception->getMessage(),
            ]);
        }
    }
}
