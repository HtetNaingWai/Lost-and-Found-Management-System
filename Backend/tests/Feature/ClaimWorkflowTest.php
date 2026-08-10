<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Claim;
use App\Models\CommunityPost;
use App\Models\User;
use App\Models\UserNotification;
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
            ->assertJsonPath('notification.type', 'return_completed');

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
}
