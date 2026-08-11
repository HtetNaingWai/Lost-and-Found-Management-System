<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PresenceController extends Controller
{
    public function heartbeat(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->markOnline();

        return response()->json([
            'user' => [
                'id' => $user->id,
                ...$user->fresh()->presencePayload(),
            ],
        ]);
    }

    public function offline(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->markOffline();

        return response()->json([
            'user' => [
                'id' => $user->id,
                ...$user->fresh()->presencePayload(),
            ],
        ]);
    }
}
