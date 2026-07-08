<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:50'],
            'nrc_no' => ['required', 'string', 'max:255'],
            'nrc_front_photo' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'nrc_back_photo' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $frontPhotoPath = $request->file('nrc_front_photo')->store('nrc-photos', 'public');
        $backPhotoPath = $request->file('nrc_back_photo')->store('nrc-photos', 'public');

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'nrc_no' => $validated['nrc_no'],
            'nrc_front_photo' => $frontPhotoPath,
            'nrc_back_photo' => $backPhotoPath,
            'password' => $validated['password'],
            'role' => 'user',
            'status' => 'active',
        ]);

        $token = $user->createToken('findit-auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful.',
            'token' => $token,
            'user' => $this->transformUser($user),
        ], Response::HTTP_CREATED);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        /** @var User|null $user */
        $user = User::query()
            ->where('email', $validated['email'])
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'The provided credentials are incorrect.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Your account is disabled. Please contact admin.',
            ], Response::HTTP_FORBIDDEN);
        }

        $token = $user->createToken('findit-auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'user' => $this->transformUser($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'user' => $this->transformUser($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logout successful.',
        ]);
    }

    protected function transformUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'nrc_no' => $user->nrc_no,
            'role' => $user->role,
            'status' => $user->status,
            'profile_image_url' => $user->profile_image
                ? asset('storage/'.$user->profile_image)
                : null,
            'nrc_front_photo_url' => $user->nrc_front_photo
                ? asset('storage/'.$user->nrc_front_photo)
                : null,
            'nrc_back_photo_url' => $user->nrc_back_photo
                ? asset('storage/'.$user->nrc_back_photo)
                : null,
        ];
    }
}
