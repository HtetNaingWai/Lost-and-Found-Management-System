<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommunityPostController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'message' => 'FindIt API is ready.',
    ]);
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/categories', [ItemController::class, 'categories']);
    Route::get('/items', [ItemController::class, 'index']);
    Route::get('/my-items', [ItemController::class, 'myItems']);
    Route::post('/items', [ItemController::class, 'store']);
    Route::get('/community-posts', [CommunityPostController::class, 'index']);
    Route::post('/community-posts', [CommunityPostController::class, 'store']);
    Route::get('/community-posts/{communityPost}', [CommunityPostController::class, 'show']);
    Route::get('/my-posts', [CommunityPostController::class, 'myPosts']);
    Route::get('/lost-items', [CommunityPostController::class, 'lostItems']);
    Route::get('/found-items', [CommunityPostController::class, 'foundItems']);
    Route::get('/messages', [MessageController::class, 'index']);
    Route::get('/messages/{user}', [MessageController::class, 'show']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/photo', [ProfileController::class, 'updatePhoto']);
    Route::delete('/profile/photo', [ProfileController::class, 'removePhoto']);
    Route::patch('/profile/password', [ProfileController::class, 'updatePassword']);

    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/overview', [AdminController::class, 'overview']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::patch('/users/{user}', [AdminController::class, 'updateUser']);
        Route::get('/items', [AdminController::class, 'items']);
        Route::patch('/items/{item}', [AdminController::class, 'updateItem']);
        Route::get('/community-posts', [AdminController::class, 'communityPosts']);
        Route::get('/community-posts/pending', [AdminController::class, 'pendingCommunityPosts']);
        Route::patch('/community-posts/{communityPost}', [AdminController::class, 'updateCommunityPost']);
        Route::put('/community-posts/{communityPost}/approve', [AdminController::class, 'approveCommunityPost']);
        Route::put('/community-posts/{communityPost}/reject', [AdminController::class, 'rejectCommunityPost']);
        Route::get('/contact-messages', [AdminController::class, 'contactMessages']);
        Route::patch('/contact-messages/{contactMessage}', [AdminController::class, 'updateContactMessage']);
    });
});
