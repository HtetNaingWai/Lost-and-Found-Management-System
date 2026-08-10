<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminWebhookController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClaimController;
use App\Http\Controllers\ContactMessageController;
use App\Http\Controllers\CommunityPostController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserDashboardController;
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
    Route::get('/dashboard/overview', [UserDashboardController::class, 'overview']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/contact-messages', [ContactMessageController::class, 'store']);
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
    Route::get('/claims', [ClaimController::class, 'index']);
    Route::post('/claims', [ClaimController::class, 'store']);
    Route::get('/messages', [MessageController::class, 'index']);
    Route::post('/messages/typing', [MessageController::class, 'typing']);
    Route::post('/messages/typing/stop', [MessageController::class, 'stopTyping']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::get('/messages/{user}', [MessageController::class, 'show']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/read', [NotificationController::class, 'markAllRead']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
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
        Route::get('/claims', [AdminController::class, 'claims']);
        Route::put('/claims/{claim}/approve', [AdminController::class, 'approveClaim']);
        Route::put('/claims/{claim}/reject', [AdminController::class, 'rejectClaim']);
        Route::put('/claims/{claim}/return', [AdminController::class, 'returnClaim']);
        Route::patch('/community-posts/{communityPost}', [AdminController::class, 'updateCommunityPost']);
        Route::put('/community-posts/{communityPost}/approve', [AdminController::class, 'approveCommunityPost']);
        Route::put('/community-posts/{communityPost}/reject', [AdminController::class, 'rejectCommunityPost']);
        Route::get('/contact-messages', [AdminController::class, 'contactMessages']);
        Route::patch('/contact-messages/{contactMessage}', [AdminController::class, 'updateContactMessage']);
        Route::get('/webhooks', [AdminWebhookController::class, 'index']);
        Route::post('/webhooks', [AdminWebhookController::class, 'store']);
        Route::patch('/webhooks/{webhook}', [AdminWebhookController::class, 'update']);
        Route::delete('/webhooks/{webhook}', [AdminWebhookController::class, 'destroy']);
        Route::get('/webhooks/{webhook}/deliveries', [AdminWebhookController::class, 'deliveries']);
        Route::post('/webhooks/{webhook}/test', [AdminWebhookController::class, 'test']);
    });
});
