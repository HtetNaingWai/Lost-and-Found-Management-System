<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Claim;
use App\Models\CommunityPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicProfilePrivacyTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_profile_hides_private_fields_and_contact_details_by_default(): void
    {
        $viewer = User::factory()->create();
        $profileUser = User::factory()->create([
            'email' => 'cecilia@example.com',
            'phone' => '09754550228',
            'nrc_no' => '9/PPL(N)123456',
            'nrc_front_photo' => 'nrc/front.jpg',
            'nrc_back_photo' => 'nrc/back.jpg',
            'profile_image' => 'profile-images/cecilia.jpg',
        ]);

        $response = $this->actingAs($viewer, 'sanctum')
            ->getJson("/api/users/{$profileUser->id}/public-profile")
            ->assertOk()
            ->assertJsonPath('user.id', $profileUser->id)
            ->assertJsonPath('user.name', $profileUser->name)
            ->assertJsonPath('user.public_phone', null)
            ->assertJsonPath('user.public_email', null)
            ->assertJsonPath('user.public_location', null)
            ->assertJsonPath('stats.lost_posts', 0)
            ->assertJsonPath('stats.found_posts', 0)
            ->assertJsonPath('stats.successful_returns', 0)
            ->assertJsonPath('rating_summary.average', null)
            ->assertJsonPath('rating_summary.count', 0)
            ->assertJsonPath('availability.status', 'available')
            ->assertJsonPath('availability.can_message', true);

        $publicUser = $response->json('user');

        $this->assertArrayNotHasKey('email', $publicUser);
        $this->assertArrayNotHasKey('phone', $publicUser);
        $this->assertArrayNotHasKey('nrc_no', $publicUser);
        $this->assertArrayNotHasKey('nrc_front_photo_url', $publicUser);
        $this->assertArrayNotHasKey('nrc_back_photo_url', $publicUser);
        $this->assertArrayNotHasKey('password', $publicUser);
        $this->assertArrayNotHasKey('remember_token', $publicUser);
        $this->assertArrayNotHasKey('ban_reason', $publicUser);
    }

    public function test_user_can_choose_which_contact_details_are_public(): void
    {
        $owner = User::factory()->create([
            'email' => 'owner@example.com',
            'phone' => '099888777',
        ]);
        $viewer = User::factory()->create();

        $this->actingAs($owner, 'sanctum')
            ->patchJson('/api/profile/privacy', [
                'show_phone_publicly' => true,
                'show_email_publicly' => false,
                'show_location_publicly' => true,
                'public_location' => 'Chanmyathazi, Mandalay',
            ])
            ->assertOk()
            ->assertJsonPath('user.show_phone_publicly', true)
            ->assertJsonPath('user.show_email_publicly', false)
            ->assertJsonPath('user.show_location_publicly', true)
            ->assertJsonPath('user.public_location', 'Chanmyathazi, Mandalay');

        $this->actingAs($viewer, 'sanctum')
            ->getJson("/api/users/{$owner->id}/public-profile")
            ->assertOk()
            ->assertJsonPath('user.public_phone', '099888777')
            ->assertJsonPath('user.public_email', null)
            ->assertJsonPath('user.public_location', 'Chanmyathazi, Mandalay');

        $this->assertDatabaseHas('users', [
            'id' => $owner->id,
            'show_phone_publicly' => true,
            'show_email_publicly' => false,
            'show_location_publicly' => true,
            'public_location' => 'Chanmyathazi, Mandalay',
        ]);
    }

    public function test_public_profile_stats_use_real_lost_found_posts_and_returned_claims(): void
    {
        $viewer = User::factory()->create();
        $profileUser = User::factory()->create();
        $category = Category::create([
            'name' => 'Wallet',
            'description' => 'Wallets and purses',
        ]);

        CommunityPost::create([
            'user_id' => $profileUser->id,
            'post_type' => 'lost',
            'title' => 'Lost wallet',
            'content' => 'Lost near the market.',
            'status' => 'pending',
        ]);

        CommunityPost::create([
            'user_id' => $profileUser->id,
            'post_type' => 'lost',
            'title' => 'Lost keys',
            'content' => 'Lost near the school.',
            'status' => 'approved',
        ]);

        CommunityPost::create([
            'user_id' => $profileUser->id,
            'post_type' => 'community',
            'title' => 'Community notice',
            'content' => 'This should not count as a report.',
            'status' => 'approved',
        ]);

        $returnedPost = CommunityPost::create([
            'user_id' => $profileUser->id,
            'post_type' => 'found',
            'title' => 'Found wallet',
            'content' => 'Returned to owner.',
            'category_id' => $category->id,
            'status' => 'returned',
            'returned_at' => now(),
        ]);

        CommunityPost::create([
            'user_id' => User::factory()->create()->id,
            'post_type' => 'lost',
            'title' => 'Other user post',
            'content' => 'Does not count.',
            'status' => 'approved',
        ]);

        Claim::create([
            'community_post_id' => $returnedPost->id,
            'user_id' => $viewer->id,
            'proof_description' => 'My name is inside.',
            'contact_phone' => '09123456789',
            'status' => 'returned',
            'returned_at' => now(),
        ]);

        $this->actingAs($viewer, 'sanctum')
            ->getJson("/api/users/{$profileUser->id}/public-profile")
            ->assertOk()
            ->assertJsonPath('stats.lost_posts', 2)
            ->assertJsonPath('stats.found_posts', 1)
            ->assertJsonPath('stats.successful_returns', 1);
    }

    public function test_unavailable_public_profile_hides_contact_details_and_message_action(): void
    {
        $viewer = User::factory()->create();
        $profileUser = User::factory()->create([
            'status' => 'disabled',
            'ban_reason' => 'Private admin note.',
            'email' => 'hidden@example.com',
            'phone' => '099777666',
            'show_phone_publicly' => true,
            'show_email_publicly' => true,
            'show_location_publicly' => true,
            'public_location' => 'Mandalay',
        ]);

        $response = $this->actingAs($viewer, 'sanctum')
            ->getJson("/api/users/{$profileUser->id}/public-profile")
            ->assertOk()
            ->assertJsonPath('user.public_phone', null)
            ->assertJsonPath('user.public_email', null)
            ->assertJsonPath('user.public_location', null)
            ->assertJsonPath('availability.status', 'unavailable')
            ->assertJsonPath('availability.message', 'This profile is currently unavailable.')
            ->assertJsonPath('availability.can_message', false);

        $this->assertArrayNotHasKey('ban_reason', $response->json('user'));
    }
}
