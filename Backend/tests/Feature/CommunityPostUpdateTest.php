<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\CommunityPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommunityPostUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_update_their_post_and_it_returns_to_pending_review(): void
    {
        $user = User::factory()->create();
        $category = Category::create([
            'name' => 'Keys',
            'description' => 'Keys and keychains',
        ]);
        $post = CommunityPost::create([
            'user_id' => $user->id,
            'post_type' => 'lost',
            'title' => 'Lost keys',
            'content' => 'Keys near the station.',
            'category_id' => $category->id,
            'location' => 'Old location',
            'latitude' => 21.9588,
            'longitude' => 96.0891,
            'item_date' => '2026-08-10',
            'status' => 'approved',
            'approved_by' => User::factory()->create(['role' => 'admin'])->id,
            'approved_at' => now(),
        ]);

        $this->actingAs($user, 'sanctum')
            ->patchJson("/api/community-posts/{$post->id}", [
                'post_type' => 'lost',
                'title' => 'Updated lost keys',
                'content' => 'I lost my keys near the market.',
                'category_id' => $category->id,
                'location' => 'Central Market',
                'latitude' => 21.9600,
                'longitude' => 96.0900,
                'item_date' => '2026-08-11',
            ])
            ->assertOk()
            ->assertJsonPath('post.title', 'Updated lost keys')
            ->assertJsonPath('post.status', 'pending');

        $this->assertDatabaseHas('community_posts', [
            'id' => $post->id,
            'title' => 'Updated lost keys',
            'status' => 'pending',
            'approved_by' => null,
        ]);
    }

    public function test_user_cannot_update_another_users_post(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $post = CommunityPost::create([
            'user_id' => $owner->id,
            'post_type' => 'community',
            'title' => 'Community Post',
            'content' => 'Original content.',
            'status' => 'pending',
        ]);

        $this->actingAs($otherUser, 'sanctum')
            ->patchJson("/api/community-posts/{$post->id}", [
                'post_type' => 'community',
                'content' => 'Changed by someone else.',
            ])
            ->assertForbidden();

        $this->assertDatabaseHas('community_posts', [
            'id' => $post->id,
            'content' => 'Original content.',
        ]);
    }

    public function test_admin_can_update_any_post_without_resetting_status(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $post = CommunityPost::create([
            'user_id' => User::factory()->create()->id,
            'post_type' => 'community',
            'title' => 'Community Post',
            'content' => 'Old notice.',
            'status' => 'approved',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/community-posts/{$post->id}", [
                'post_type' => 'community',
                'content' => 'Updated admin notice.',
            ])
            ->assertOk()
            ->assertJsonPath('post.content', 'Updated admin notice.')
            ->assertJsonPath('post.status', 'approved');

        $this->assertDatabaseHas('community_posts', [
            'id' => $post->id,
            'content' => 'Updated admin notice.',
            'status' => 'approved',
        ]);
    }
}
