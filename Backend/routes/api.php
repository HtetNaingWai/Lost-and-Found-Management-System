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
use App\Http\Controllers\PresenceController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RatingController;
use App\Http\Controllers\SavedPostController;
use App\Http\Controllers\SupportConversationController;
use App\Http\Controllers\UserDashboardController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'message' => 'FindIt API is ready.',
    ]);
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware(['auth:sanctum', 'active.account'])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/dashboard/overview', [UserDashboardController::class, 'overview']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/presence/heartbeat', [PresenceController::class, 'heartbeat']);
    Route::post('/presence/offline', [PresenceController::class, 'offline']);
    Route::post('/contact-messages', [ContactMessageController::class, 'store']);
    Route::get('/support/conversation', [SupportConversationController::class, 'show']);
    Route::post('/support/messages', [SupportConversationController::class, 'store']);
    Route::delete('/support/messages/{message}', [SupportConversationController::class, 'destroyMessage']);
    Route::post('/support/typing', [SupportConversationController::class, 'typing']);
    Route::post('/support/typing/stop', [SupportConversationController::class, 'stopTyping']);
    Route::get('/categories', [ItemController::class, 'categories']);
    Route::get('/items', [ItemController::class, 'index']);
    Route::get('/my-items', [ItemController::class, 'myItems']);
    Route::post('/items', [ItemController::class, 'store']);
    Route::get('/community-posts', [CommunityPostController::class, 'index']);
    Route::post('/community-posts', [CommunityPostController::class, 'store']);
    Route::get('/community-posts/{communityPost}', [CommunityPostController::class, 'show']);
    Route::match(['patch', 'post'], '/community-posts/{communityPost}', [CommunityPostController::class, 'update']);
    Route::match(['patch', 'put'], '/community-posts/{communityPost}/return', [ClaimController::class, 'returnCommunityPost']);
    Route::delete('/community-posts/{communityPost}', [CommunityPostController::class, 'destroy']);
    Route::get('/my-posts', [CommunityPostController::class, 'myPosts']);
    Route::get('/lost-items', [CommunityPostController::class, 'lostItems']);
    Route::get('/found-items', [CommunityPostController::class, 'foundItems']);
    Route::get('/saved-posts', [SavedPostController::class, 'index']);
    Route::get('/saved-posts/ids', [SavedPostController::class, 'ids']);
    Route::post('/saved-posts/{communityPost}', [SavedPostController::class, 'store']);
    Route::delete('/saved-posts/{communityPost}', [SavedPostController::class, 'destroy']);
    Route::get('/claims', [ClaimController::class, 'index']);
    Route::post('/claims', [ClaimController::class, 'store']);
    Route::patch('/claims/{claim}', [ClaimController::class, 'update']);
    Route::match(['patch', 'put'], '/claims/{claim}/return', [ClaimController::class, 'markReturned']);
    Route::delete('/claims/{claim}', [ClaimController::class, 'destroy']);
    Route::get('/messages', [MessageController::class, 'index']);
    Route::post('/messages/typing', [MessageController::class, 'typing']);
    Route::post('/messages/typing/stop', [MessageController::class, 'stopTyping']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::delete('/messages/conversations/{user}', [MessageController::class, 'destroyConversation']);
    Route::delete('/messages/{message}', [MessageController::class, 'destroy']);
    Route::get('/messages/{user}', [MessageController::class, 'show']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/read', [NotificationController::class, 'markAllRead']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::get('/users/{user}/public-profile', [ProfileController::class, 'publicProfile']);
    Route::get('/users/{user}/ratings', [RatingController::class, 'publicReviews']);
    Route::patch('/profile/privacy', [ProfileController::class, 'updatePrivacy']);
    Route::post('/profile/photo', [ProfileController::class, 'updatePhoto']);
    Route::delete('/profile/photo', [ProfileController::class, 'removePhoto']);
    Route::patch('/profile/password', [ProfileController::class, 'updatePassword']);
    Route::get('/ratings/pending', [RatingController::class, 'pending']);
    Route::get('/ratings/eligibility', [RatingController::class, 'eligibility']);
    Route::post('/ratings', [RatingController::class, 'store']);

    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/overview', [AdminController::class, 'overview']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::patch('/users/{user}', [AdminController::class, 'updateUser']);
        Route::get('/items', [AdminController::class, 'items']);
        Route::patch('/items/{item}', [AdminController::class, 'updateItem']);
        Route::get('/community-posts', [AdminController::class, 'communityPosts']);
        Route::get('/community-posts/pending', [AdminController::class, 'pendingCommunityPosts']);
        Route::get('/claims', [AdminController::class, 'claims']);
        Route::patch('/community-posts/{communityPost}', [AdminController::class, 'updateCommunityPost']);
        Route::put('/community-posts/{communityPost}/approve', [AdminController::class, 'approveCommunityPost']);
        Route::put('/community-posts/{communityPost}/reject', [AdminController::class, 'rejectCommunityPost']);
        Route::get('/contact-messages', [AdminController::class, 'contactMessages']);
        Route::patch('/contact-messages/{contactMessage}', [AdminController::class, 'updateContactMessage']);
        Route::get('/support-conversations', [SupportConversationController::class, 'adminIndex']);
        Route::post('/support-conversations/users/{user}/messages', [SupportConversationController::class, 'adminStoreForUser']);
        Route::get('/support-conversations/{supportConversation}', [SupportConversationController::class, 'adminShow']);
        Route::post('/support-conversations/{supportConversation}/messages', [SupportConversationController::class, 'adminStore']);
        Route::patch('/support-conversations/{supportConversation}/resolve', [SupportConversationController::class, 'adminResolve']);
        Route::post('/support-conversations/{supportConversation}/typing', [SupportConversationController::class, 'adminTyping']);
        Route::post('/support-conversations/{supportConversation}/typing/stop', [SupportConversationController::class, 'adminStopTyping']);
        Route::get('/webhooks', [AdminWebhookController::class, 'index']);
        Route::post('/webhooks', [AdminWebhookController::class, 'store']);
        Route::patch('/webhooks/{webhook}', [AdminWebhookController::class, 'update']);
        Route::delete('/webhooks/{webhook}', [AdminWebhookController::class, 'destroy']);
        Route::get('/webhooks/{webhook}/deliveries', [AdminWebhookController::class, 'deliveries']);
        Route::post('/webhooks/{webhook}/test', [AdminWebhookController::class, 'test']);
    });
});
