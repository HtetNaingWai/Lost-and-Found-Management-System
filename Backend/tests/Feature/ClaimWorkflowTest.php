<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Claim;
use App\Models\CommunityPost;
use App\Models\Message;
use App\Models\User;
use App\Models\UserNotification;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClaimWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_claimant_can_update_pending_claim(): void
    {
        [$claimant, , $claim] = $this->createFoundPostClaim();

        $this->actingAs($claimant, 'sanctum')
            ->patchJson("/api/claims/{$claim->id}", [
                'proof_description' => 'Updated identifying detail for the item.',
                'contact_phone' => '099999999',
            ])
            ->assertOk()
            ->assertJsonPath('claim.proof_description', 'Updated identifying detail for the item.')
            ->assertJsonPath('claim.contact_phone', '099999999')
            ->assertJsonPath('claim.status', 'pending');

        $this->assertDatabaseHas('claims', [
            'id' => $claim->id,
            'proof_description' => 'Updated identifying detail for the item.',
            'contact_phone' => '099999999',
            'status' => 'pending',
        ]);
    }

    public function test_claimant_cannot_update_finalized_claim(): void
    {
        [$claimant, , $claim] = $this->createFoundPostClaim(['status' => 'approved']);

        $this->actingAs($claimant, 'sanctum')
            ->patchJson("/api/claims/{$claim->id}", [
                'proof_description' => 'Trying to change an approved claim.',
                'contact_phone' => '099999999',
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Only pending claims can be edited.');
    }

    public function test_claimant_can_withdraw_pending_claim(): void
    {
        [$claimant, , $claim] = $this->createFoundPostClaim();

        $this->actingAs($claimant, 'sanctum')
            ->deleteJson("/api/claims/{$claim->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Claim withdrawn successfully.');

        $this->assertDatabaseMissing('claims', [
            'id' => $claim->id,
        ]);
    }

    public function test_claimant_cannot_withdraw_finalized_claim(): void
    {
        [$claimant, , $claim] = $this->createFoundPostClaim(['status' => 'rejected']);

        $this->actingAs($claimant, 'sanctum')
            ->deleteJson("/api/claims/{$claim->id}")
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Only pending claims can be withdrawn.');

        $this->assertDatabaseHas('claims', [
            'id' => $claim->id,
            'status' => 'rejected',
        ]);
    }

    public function test_finder_can_mark_pending_claim_as_returned(): void
    {
        [$claimant, $finder, $claim] = $this->createFoundPostClaim();

        $this->actingAs($finder, 'sanctum')
            ->patchJson("/api/claims/{$claim->id}/return")
            ->assertOk()
            ->assertJsonPath('claim.status', 'returned')
            ->assertJsonPath('claim.community_post.status', 'returned')
            ->assertJsonPath('notification.type', 'return_completed')
            ->assertJsonCount(2, 'rating_notifications')
            ->assertJsonPath('rating_notifications.0.type', 'rating_available')
            ->assertJsonPath('rating_notifications.0.data.action', 'rating_available');

        $this->assertDatabaseHas('claims', [
            'id' => $claim->id,
            'status' => 'returned',
        ]);
        $this->assertNotNull($claim->fresh()->returned_at);
        $this->assertSame('returned', $claim->communityPost->fresh()->status);
        $this->assertNotNull($claim->communityPost->fresh()->returned_at);

        $this->assertDatabaseHas('user_notifications', [
            'recipient_user_id' => $claimant->id,
            'type' => 'item_returned',
            'title' => 'Item returned',
        ]);
        $this->assertDatabaseHas('user_notifications', [
            'recipient_user_id' => $finder->id,
            'type' => 'return_completed',
            'title' => 'Return completed',
        ]);
        $this->assertDatabaseHas('user_notifications', [
            'recipient_user_id' => $claimant->id,
            'type' => 'rating_available',
            'title' => 'Rate your return experience',
        ]);
        $this->assertDatabaseHas('user_notifications', [
            'recipient_user_id' => $finder->id,
            'type' => 'rating_available',
            'title' => 'Rate your return experience',
        ]);
    }

    public function test_rating_available_notifications_are_idempotent(): void
    {
        [$claimant, , $claim] = $this->createFoundPostClaim();

        NotificationService::createOnce(
            $claimant->id,
            'rating_available',
            'Rate your return experience',
            'First notification.',
            ['claim_id' => $claim->id],
            "rating_available:claim:{$claim->id}:reviewer:{$claimant->id}",
        );
        NotificationService::createOnce(
            $claimant->id,
            'rating_available',
            'Rate your return experience',
            'Second notification.',
            ['claim_id' => $claim->id],
            "rating_available:claim:{$claim->id}:reviewer:{$claimant->id}",
        );

        $this->assertSame(
            1,
            UserNotification::query()
                ->where('recipient_user_id', $claimant->id)
                ->where('type', 'rating_available')
                ->count(),
        );
    }

    public function test_non_finder_cannot_mark_claim_as_returned(): void
    {
        [, , $claim] = $this->createFoundPostClaim();
        $otherUser = User::factory()->create();

        $this->actingAs($otherUser, 'sanctum')
            ->patchJson("/api/claims/{$claim->id}/return")
            ->assertForbidden();

        $this->assertDatabaseHas('claims', [
            'id' => $claim->id,
            'status' => 'pending',
        ]);
    }

    public function test_returned_found_post_is_hidden_from_public_found_and_community_lists(): void
    {
        [, $finder, $claim] = $this->createFoundPostClaim();
        $viewer = User::factory()->create();

        $this->actingAs($finder, 'sanctum')
            ->patchJson("/api/claims/{$claim->id}/return")
            ->assertOk();

        $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/found-items')
            ->assertOk()
            ->assertJsonMissingPath('posts.0.id');

        $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/community-posts')
            ->assertOk()
            ->assertJsonMissingPath('posts.0.id');
    }

    public function test_found_post_with_pending_claim_stays_public(): void
    {
        $claimant = User::factory()->create();
        $finder = User::factory()->create();
        $viewer = User::factory()->create();
        $post = $this->createApprovedFoundPost($finder);

        $this->actingAs($claimant, 'sanctum')
            ->postJson('/api/claims', [
                'community_post_id' => $post->id,
                'proof_description' => 'The wallet has my student card inside.',
                'contact_phone' => '09123456789',
            ])
            ->assertCreated();

        $this->assertSame('approved', $post->fresh()->status);

        $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/found-items')
            ->assertOk()
            ->assertJsonFragment([
                'id' => $post->id,
                'status' => 'approved',
            ]);

        $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/community-posts')
            ->assertOk()
            ->assertJsonFragment([
                'id' => $post->id,
                'status' => 'approved',
            ]);
    }

    public function test_found_post_with_approved_claim_stays_public_until_returned(): void
    {
        [, , $claim] = $this->createFoundPostClaim(['status' => 'approved']);
        $viewer = User::factory()->create();
        $post = $claim->communityPost;

        $this->assertSame('approved', $post->fresh()->status);

        $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/found-items')
            ->assertOk()
            ->assertJsonFragment([
                'id' => $post->id,
                'status' => 'approved',
            ]);
    }

    public function test_found_post_with_active_conversation_stays_public(): void
    {
        $finder = User::factory()->create();
        $claimant = User::factory()->create();
        $viewer = User::factory()->create();
        $post = $this->createApprovedFoundPost($finder);

        Message::create([
            'sender_id' => $claimant->id,
            'receiver_id' => $finder->id,
            'community_post_id' => $post->id,
            'message' => 'I think this is my wallet.',
            'is_read' => false,
        ]);

        $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/found-items')
            ->assertOk()
            ->assertJsonFragment([
                'id' => $post->id,
                'status' => 'approved',
            ]);
    }

    public function test_lost_post_with_active_conversation_stays_public_until_returned(): void
    {
        $owner = User::factory()->create();
        $helper = User::factory()->create();
        $viewer = User::factory()->create();
        $post = $this->createApprovedLostPost($owner);

        Message::create([
            'sender_id' => $helper->id,
            'receiver_id' => $owner->id,
            'community_post_id' => $post->id,
            'message' => 'I found your keys near the market.',
            'is_read' => false,
        ]);

        $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/lost-items')
            ->assertOk()
            ->assertJsonFragment([
                'id' => $post->id,
                'status' => 'approved',
            ]);

        $this->actingAs($owner, 'sanctum')
            ->patchJson("/api/community-posts/{$post->id}/return", [
                'participant_user_id' => $helper->id,
            ])
            ->assertOk();

        $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/lost-items')
            ->assertOk()
            ->assertJsonMissingPath('posts.0.id');
    }

    public function test_lost_owner_can_mark_item_returned_after_item_conversation(): void
    {
        $owner = User::factory()->create();
        $helper = User::factory()->create();
        $post = $this->createApprovedLostPost($owner);

        Message::create([
            'sender_id' => $helper->id,
            'receiver_id' => $owner->id,
            'community_post_id' => $post->id,
            'message' => 'I found your keys near the market.',
            'is_read' => false,
        ]);

        $response = $this->actingAs($owner, 'sanctum')
            ->patchJson("/api/community-posts/{$post->id}/return", [
                'participant_user_id' => $helper->id,
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Item marked as returned.')
            ->assertJsonPath('claim.status', 'returned')
            ->assertJsonPath('claim.community_post.status', 'returned')
            ->assertJsonCount(2, 'rating_notifications');

        $claimId = $response->json('claim.id');

        $this->assertDatabaseHas('claims', [
            'id' => $claimId,
            'community_post_id' => $post->id,
            'user_id' => $helper->id,
            'status' => 'returned',
        ]);
        $this->assertSame('returned', $post->fresh()->status);
        $this->assertDatabaseHas('user_notifications', [
            'recipient_user_id' => $owner->id,
            'type' => 'return_completed',
        ]);
        $this->assertDatabaseHas('user_notifications', [
            'recipient_user_id' => $helper->id,
            'type' => 'item_returned',
        ]);
    }

    public function test_lost_return_requires_connected_item_conversation_or_claim(): void
    {
        $owner = User::factory()->create();
        $randomUser = User::factory()->create();
        $post = $this->createApprovedLostPost($owner);

        $this->actingAs($owner, 'sanctum')
            ->patchJson("/api/community-posts/{$post->id}/return", [
                'participant_user_id' => $randomUser->id,
            ])
            ->assertForbidden()
            ->assertJsonPath('message', 'A return can only be completed with a member connected to this item conversation.');

        $this->assertDatabaseMissing('claims', [
            'community_post_id' => $post->id,
            'user_id' => $randomUser->id,
        ]);
        $this->assertSame('approved', $post->fresh()->status);
    }

    public function test_finder_receives_notification_when_found_item_is_claimed(): void
    {
        $claimant = User::factory()->create(['name' => 'Htet Naing Wai']);
        $finder = User::factory()->create();
        $post = $this->createApprovedFoundPost($finder);

        $response = $this->actingAs($claimant, 'sanctum')
            ->postJson('/api/claims', [
                'community_post_id' => $post->id,
                'proof_description' => 'The wallet has my student card inside.',
                'contact_phone' => '09123456789',
            ])
            ->assertCreated();

        $claimId = $response->json('claim.id');

        $notification = UserNotification::query()
            ->where('recipient_user_id', $finder->id)
            ->where('type', 'claim_received')
            ->first();

        $this->assertNotNull($notification);
        $this->assertSame('New claim received', $notification->title);
        $this->assertSame(
            'Htet Naing Wai submitted a claim for your found item "Black Wallet".',
            $notification->detail,
        );
        $this->assertSame($claimId, $notification->data['claim_id']);
        $this->assertSame($post->id, $notification->data['community_post_id']);
        $this->assertSame($claimant->id, $notification->data['claimant_id']);
        $this->assertSame('my-found', $notification->data['section']);
    }

    /**
     * @param array<string, mixed> $claimOverrides
     * @return array{0: User, 1: User, 2: Claim}
     */
    private function createFoundPostClaim(array $claimOverrides = []): array
    {
        $claimant = User::factory()->create();
        $finder = User::factory()->create();
        $post = $this->createApprovedFoundPost($finder);

        $claim = Claim::create([
            'item_id' => null,
            'community_post_id' => $post->id,
            'user_id' => $claimant->id,
            'proof_description' => 'Original identifying details.',
            'contact_phone' => '091111111',
            'status' => 'pending',
            ...$claimOverrides,
        ]);

        return [$claimant, $finder, $claim];
    }

    private function createApprovedFoundPost(User $finder): CommunityPost
    {
        $category = Category::create([
            'name' => 'Accessories',
            'description' => 'Small personal belongings.',
        ]);

        return CommunityPost::create([
            'user_id' => $finder->id,
            'post_type' => 'found',
            'title' => 'Black Wallet',
            'content' => 'Found near the community office.',
            'category_id' => $category->id,
            'location' => 'Community Office',
            'item_date' => now()->toDateString(),
            'status' => 'approved',
        ]);
    }

    private function createApprovedLostPost(User $owner): CommunityPost
    {
        $category = Category::create([
            'name' => 'Keys',
            'description' => 'Keys and keychains.',
        ]);

        return CommunityPost::create([
            'user_id' => $owner->id,
            'post_type' => 'lost',
            'title' => 'Cycle Keys',
            'content' => 'I lost my cycle keys near the market.',
            'category_id' => $category->id,
            'location' => 'Central Market',
            'item_date' => now()->toDateString(),
            'status' => 'approved',
        ]);
    }
}
