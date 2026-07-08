<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('community_posts', function (Blueprint $table) {
            $table->enum('post_type', ['community', 'lost', 'found'])->default('community')->after('user_id');
            $table->foreignId('category_id')->nullable()->after('content')->constrained()->nullOnDelete();
            $table->string('location')->nullable()->after('category_id');
            $table->date('item_date')->nullable()->after('location');
            $table->text('admin_note')->nullable()->after('status');
            $table->foreignId('approved_by')->nullable()->after('admin_note')->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable()->after('approved_by');
            $table->timestamp('rejected_at')->nullable()->after('approved_at');
        });
    }

    public function down(): void
    {
        Schema::table('community_posts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('approved_by');
            $table->dropConstrainedForeignId('category_id');
            $table->dropColumn([
                'post_type',
                'location',
                'item_date',
                'admin_note',
                'approved_at',
                'rejected_at',
            ]);
        });
    }
};
