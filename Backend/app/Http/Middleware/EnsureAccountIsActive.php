<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountIsActive
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->status === 'banned') {
            return new JsonResponse([
                'message' => trim('Your account has been suspended by FindIt Admin.'
                    .($user->ban_reason ? ' Reason: '.$user->ban_reason : '')
                    .' Please contact FindIt support.'),
            ], Response::HTTP_FORBIDDEN);
        }

        if ($user && $user->status !== 'active') {
            return new JsonResponse([
                'message' => 'Your account is disabled. Please contact FindIt support.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
