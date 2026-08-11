<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type')->default('support');
            $table->string('status')->default('open');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'type']);
            $table->index(['admin_id', 'status']);
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->foreignId('support_conversation_id')
                ->nullable()
                ->after('receiver_id')
                ->constrained('support_conversations')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('support_conversation_id');
        });

        Schema::dropIfExists('support_conversations');
    }
};
