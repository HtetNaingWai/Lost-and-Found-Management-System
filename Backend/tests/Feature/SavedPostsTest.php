<?php

namespace Tests\Feature;

use App\Models\CommunityPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SavedPostsTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_save_and_remove_a_visible_post(): void
    {
        $user = User::factory()->create();
        $owner = User::factory()->create();
        $post = CommunityPost::create([
            'user_id' => $owner->id,
            'post_type' => 'lost',
            'title' => 'Lost wallet',
            'content' => 'Black wallet near the market.',
            'status' => 'approved',
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/saved-posts/{$post->id}")
            ->assertCreated()
            ->assertJsonPath('post.id', $post->id);

        $this->assertDatabaseHas('saved_posts', [
            'user_id' => $user->id,
            'community_post_id' => $post->id,
        ]);

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/saved-posts/{$post->id}")
            ->assertOk();

        $this->assertDatabaseMissing('saved_posts', [
            'user_id' => $user->id,
            'community_post_id' => $post->id,
        ]);
    }

    public function test_user_cannot_save_same_post_twice(): void
    {
        $user = User::factory()->create();
        $post = CommunityPost::create([
            'user_id' => User::factory()->create()->id,
            'post_type' => 'found',
            'title' => 'Found keys',
            'content' => 'Keys found at the bus stop.',
            'status' => 'approved',
        ]);

        $this->actingAs($user, 'sanctum')->postJson("/api/saved-posts/{$post->id}")->assertCreated();
        $this->actingAs($user, 'sanctum')->postJson("/api/saved-posts/{$post->id}")->assertCreated();

        $this->assertDatabaseCount('saved_posts', 1);
    }

    public function test_users_only_see_their_own_saved_posts(): void
    {
        $firstUser = User::factory()->create();
        $secondUser = User::factory()->create();
        $post = CommunityPost::create([
            'user_id' => User::factory()->create()->id,
            'post_type' => 'community',
            'title' => 'Community update',
            'content' => 'Please check the office.',
            'status' => 'approved',
        ]);

        $this->actingAs($firstUser, 'sanctum')->postJson("/api/saved-posts/{$post->id}");

        $this->actingAs($secondUser, 'sanctum')
            ->getJson('/api/saved-posts')
            ->assertOk()
            ->assertJsonPath('ids', []);
    }
}
