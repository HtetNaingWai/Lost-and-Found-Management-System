<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reviewer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reviewed_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('community_post_id')->nullable()->constrained('community_posts')->nullOnDelete();
            $table->foreignId('claim_id')->constrained('claims')->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->string('comment', 500)->nullable();
            $table->timestamps();

            $table->unique(['reviewer_id', 'claim_id']);
            $table->index('reviewed_user_id');
            $table->index('community_post_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_ratings');
    }
};
