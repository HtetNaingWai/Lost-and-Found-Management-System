<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'phone' => ['required', 'string', 'max:50'],
            'nrc_no' => ['required', 'string', 'max:255'],
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profile information updated successfully.',
            'user' => $this->transformUser($user->fresh()),
        ]);
    }

    public function updatePhoto(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'profile_image' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if ($user->profile_image) {
            Storage::disk('public')->delete($user->profile_image);
        }

        $path = $validated['profile_image']->store('profile-images', 'public');

        $user->update([
            'profile_image' => $path,
        ]);

        return response()->json([
            'message' => 'Profile image updated successfully.',
            'user' => $this->transformUser($user->fresh()),
        ]);
    }

    public function removePhoto(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->profile_image) {
            Storage::disk('public')->delete($user->profile_image);
        }

        $user->update([
            'profile_image' => null,
        ]);

        return response()->json([
            'message' => 'Profile image removed successfully.',
            'user' => $this->transformUser($user->fresh()),
        ]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        if (! Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Your current password is incorrect.',
                'errors' => [
                    'current_password' => ['Your current password is incorrect.'],
                ],
            ], 422);
        }

        $user->update([
            'password' => $validated['password'],
        ]);

        return response()->json([
            'message' => 'Password updated successfully.',
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
