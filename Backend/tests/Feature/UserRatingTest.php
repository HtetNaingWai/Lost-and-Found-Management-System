<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Claim;
use App\Models\CommunityPost;
use App\Models\User;
use App\Models\UserRating;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserRatingTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_rate_other_participant_after_return_is_completed(): void
    {
        [$claimant, $finder, $claim] = $this->createReturnedInteraction();

        $this->actingAs($claimant, 'sanctum')
            ->postJson('/api/ratings', [
                'claim_id' => $claim->id,
                'rating' => 5,
                'comment' => 'Very helpful.',
            ])
            ->assertCreated()
            ->assertJsonPath('message', 'Thanks for your feedback.')
            ->assertJsonPath('rating.rating', 5)
            ->assertJsonPath('rating.comment', 'Very helpful.')
            ->assertJsonPath('rating_summary.average', 5)
            ->assertJsonPath('rating_summary.count', 1)
            ->assertJsonPath('notification.type', 'rating_received')
            ->assertJsonPath('notification.data.action', 'rating_received');

        $this->assertDatabaseHas('user_ratings', [
            'reviewer_id' => $claimant->id,
            'reviewed_user_id' => $finder->id,
            'claim_id' => $claim->id,
            'rating' => 5,
            'comment' => 'Very helpful.',
        ]);
        $this->assertDatabaseHas('user_notifications', [
            'recipient_user_id' => $finder->id,
            'type' => 'rating_received',
            'title' => 'New review received',
        ]);
    }

    public function test_both_participants_can_rate_each_other_once_for_same_return(): void
    {
        [$claimant, $finder, $claim] = $this->createReturnedInteraction();

        $this->actingAs($claimant, 'sanctum')
            ->postJson('/api/ratings', [
                'claim_id' => $claim->id,
                'rating' => 5,
            ])
            ->assertCreated();

        $this->actingAs($finder, 'sanctum')
            ->postJson('/api/ratings', [
                'claim_id' => $claim->id,
                'rating' => 4,
            ])
            ->assertCreated();

        $this->assertDatabaseHas('user_ratings', [
            'reviewer_id' => $claimant->id,
            'reviewed_user_id' => $finder->id,
            'claim_id' => $claim->id,
            'rating' => 5,
        ]);
        $this->assertDatabaseHas('user_ratings', [
            'reviewer_id' => $finder->id,
            'reviewed_user_id' => $claimant->id,
            'claim_id' => $claim->id,
            'rating' => 4,
        ]);
    }

    public function test_duplicate_rating_for_same_claim_is_rejected(): void
    {
        [$claimant, , $claim] = $this->createReturnedInteraction();

        UserRating::create([
            'reviewer_id' => $claimant->id,
            'reviewed_user_id' => $claim->communityPost->user_id,
            'community_post_id' => $claim->community_post_id,
            'claim_id' => $claim->id,
            'rating' => 5,
        ]);

        $this->actingAs($claimant, 'sanctum')
            ->postJson('/api/ratings', [
                'claim_id' => $claim->id,
                'rating' => 4,
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'You already reviewed this return.');
    }

    public function test_random_user_cannot_rate_unrelated_return(): void
    {
        [, , $claim] = $this->createReturnedInteraction();
        $randomUser = User::factory()->create();

        $this->actingAs($randomUser, 'sanctum')
            ->postJson('/api/ratings', [
                'claim_id' => $claim->id,
                'rating' => 5,
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'You were not part of this return.');
    }

    public function test_rating_before_return_is_completed_is_rejected(): void
    {
        [$claimant, , $claim] = $this->createReturnedInteraction(['claim_status' => 'pending', 'post_status' => 'claimed']);

        $this->actingAs($claimant, 'sanctum')
            ->postJson('/api/ratings', [
                'claim_id' => $claim->id,
                'rating' => 5,
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Return is not completed.');
    }

    public function test_rating_values_must_be_whole_numbers_between_one_and_five(): void
    {
        [$claimant, , $claim] = $this->createReturnedInteraction();

        foreach ([0, 6, 3.5, 'bad'] as $invalidRating) {
            $this->actingAs($claimant, 'sanctum')
                ->postJson('/api/ratings', [
                    'claim_id' => $claim->id,
                    'rating' => $invalidRating,
                ])
                ->assertUnprocessable();
        }

        $this->assertDatabaseCount('user_ratings', 0);
    }

    public function test_frontend_cannot_override_reviewer_or_reviewed_user(): void
    {
        [$claimant, $finder, $claim] = $this->createReturnedInteraction();

        $this->actingAs($claimant, 'sanctum')
            ->postJson('/api/ratings', [
                'claim_id' => $claim->id,
                'reviewed_user_id' => $claimant->id,
                'reviewer_id' => $finder->id,
                'rating' => 5,
            ])
            ->assertUnprocessable();

        $this->assertDatabaseCount('user_ratings', 0);
    }

    public function test_eligibility_endpoint_returns_other_participant_and_duplicate_state(): void
    {
        [$claimant, $finder, $claim] = $this->createReturnedInteraction();

        $this->actingAs($claimant, 'sanctum')
            ->getJson("/api/ratings/eligibility?claim_id={$claim->id}")
            ->assertOk()
            ->assertJsonPath('eligible', true)
            ->assertJsonPath('already_rated', false)
            ->assertJsonPath('reviewed_user.id', $finder->id)
            ->assertJsonPath('item.title', 'Black Wallet')
            ->assertJsonPath('item.category.name', 'Wallet');

        UserRating::create([
            'reviewer_id' => $claimant->id,
            'reviewed_user_id' => $finder->id,
            'community_post_id' => $claim->community_post_id,
            'claim_id' => $claim->id,
            'rating' => 5,
        ]);

        $this->actingAs($claimant, 'sanctum')
            ->getJson("/api/ratings/eligibility?claim_id={$claim->id}")
            ->assertOk()
            ->assertJsonPath('eligible', false)
            ->assertJsonPath('already_rated', true);
    }

    public function test_pending_ratings_endpoint_returns_reviews_to_give_and_removes_rated_claims(): void
    {
        [$claimant, $finder, $claim] = $this->createReturnedInteraction();

        $this->actingAs($claimant, 'sanctum')
            ->getJson('/api/ratings/pending')
            ->assertOk()
            ->assertJsonCount(1, 'ratings')
            ->assertJsonPath('ratings.0.claim_id', $claim->id)
            ->assertJsonPath('ratings.0.reviewed_user.id', $finder->id)
            ->assertJsonPath('ratings.0.item.title', 'Black Wallet');

        UserRating::create([
            'reviewer_id' => $claimant->id,
            'reviewed_user_id' => $finder->id,
            'community_post_id' => $claim->community_post_id,
            'claim_id' => $claim->id,
            'rating' => 5,
        ]);

        $this->actingAs($claimant, 'sanctum')
            ->getJson('/api/ratings/pending')
            ->assertOk()
            ->assertJsonCount(0, 'ratings');
    }

    public function test_public_profile_returns_rating_summary_and_recent_reviews(): void
    {
        [$claimant, $finder, $claim] = $this->createReturnedInteraction();

        UserRating::create([
            'reviewer_id' => $claimant->id,
            'reviewed_user_id' => $finder->id,
            'community_post_id' => $claim->community_post_id,
            'claim_id' => $claim->id,
            'rating' => 4,
            'comment' => 'Helpful and quick.',
        ]);

        $this->actingAs($claimant, 'sanctum')
            ->getJson("/api/users/{$finder->id}/public-profile")
            ->assertOk()
            ->assertJsonPath('rating_summary.average', 4)
            ->assertJsonPath('rating_summary.count', 1)
            ->assertJsonPath('recent_reviews.0.rating', 4)
            ->assertJsonPath('recent_reviews.0.comment', 'Helpful and quick.')
            ->assertJsonPath('recent_reviews.0.reviewer.name', $claimant->name);
    }

    protected function createReturnedInteraction(array $overrides = []): array
    {
        $claimant = User::factory()->create(['name' => 'Cecilia']);
        $finder = User::factory()->create(['name' => 'Charm']);
        $category = Category::create([
            'name' => 'Wallet',
            'description' => 'Wallets',
        ]);

        $post = CommunityPost::create([
            'user_id' => $finder->id,
            'post_type' => 'found',
            'title' => 'Black Wallet',
            'content' => 'Found near the market.',
            'category_id' => $category->id,
            'location' => 'Mandalay',
            'item_date' => '2026-08-11',
            'status' => $overrides['post_status'] ?? 'returned',
            'returned_at' => ($overrides['post_status'] ?? 'returned') === 'returned' ? now() : null,
        ]);

        $claim = Claim::create([
            'community_post_id' => $post->id,
            'user_id' => $claimant->id,
            'proof_description' => 'My ID is inside.',
            'contact_phone' => '09123456789',
            'status' => $overrides['claim_status'] ?? 'returned',
            'returned_at' => ($overrides['claim_status'] ?? 'returned') === 'returned' ? now() : null,
        ]);

        return [
            $claimant,
            $finder,
            $claim->fresh(['user', 'communityPost.user']),
        ];
    }
}
