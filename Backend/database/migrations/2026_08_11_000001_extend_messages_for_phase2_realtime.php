<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->foreignId('community_post_id')->nullable()->after('item_id')->constrained('community_posts')->nullOnDelete();
            $table->string('attachment_path')->nullable()->after('message');
            $table->string('attachment_type')->nullable()->after('attachment_path');
            $table->string('attachment_name')->nullable()->after('attachment_type');
            $table->timestamp('read_at')->nullable()->after('is_read');
            $table->timestamp('deleted_at')->nullable()->after('read_at');
        });

        Schema::create('conversation_deletions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('participant_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('community_post_id')->nullable()->constrained('community_posts')->nullOnDelete();
            $table->foreignId('item_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('deleted_before');
            $table->timestamps();

            $table->index(['user_id', 'participant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversation_deletions');

        Schema::table('messages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('community_post_id');
            $table->dropColumn([
                'attachment_path',
                'attachment_type',
                'attachment_name',
                'read_at',
                'deleted_at',
            ]);
        });
    }
};
