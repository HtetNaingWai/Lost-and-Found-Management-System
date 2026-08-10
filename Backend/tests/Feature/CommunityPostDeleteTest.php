<?php

namespace Tests\Feature;

use App\Models\CommunityPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommunityPostDeleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_delete_their_post(): void
    {
        $user = User::factory()->create();
        $post = CommunityPost::create([
            'user_id' => $user->id,
            'post_type' => 'lost',
            'title' => 'Lost keys',
            'content' => 'Keys near the station.',
            'status' => 'approved',
        ]);

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/community-posts/{$post->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Post deleted successfully.');

        $this->assertDatabaseMissing('community_posts', [
            'id' => $post->id,
        ]);
    }

    public function test_user_cannot_delete_another_users_post(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $post = CommunityPost::create([
            'user_id' => $owner->id,
            'post_type' => 'found',
            'title' => 'Found wallet',
            'content' => 'Wallet at the market.',
            'status' => 'approved',
        ]);

        $this->actingAs($otherUser, 'sanctum')
            ->deleteJson("/api/community-posts/{$post->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('community_posts', [
            'id' => $post->id,
        ]);
    }

    public function test_admin_can_delete_any_post(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $post = CommunityPost::create([
            'user_id' => User::factory()->create()->id,
            'post_type' => 'community',
            'title' => 'Community notice',
            'content' => 'Please check the office.',
            'status' => 'pending',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/community-posts/{$post->id}")
            ->assertOk();

        $this->assertDatabaseMissing('community_posts', [
            'id' => $post->id,
        ]);
    }
}
