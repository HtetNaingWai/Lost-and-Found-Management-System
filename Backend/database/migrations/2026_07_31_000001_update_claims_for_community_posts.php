<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('claims', function (Blueprint $table) {
            $table->dropForeign(['item_id']);
            $table->dropUnique('claims_item_id_user_id_unique');
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE claims MODIFY item_id BIGINT UNSIGNED NULL');
        } else {
            Schema::table('claims', function (Blueprint $table) {
                $table->unsignedBigInteger('item_id')->nullable()->change();
            });
        }

        Schema::table('claims', function (Blueprint $table) {
            $table->foreignId('community_post_id')
                ->nullable()
                ->after('item_id')
                ->constrained('community_posts')
                ->cascadeOnDelete();

            $table->foreign('item_id')->references('id')->on('items')->nullOnDelete();
            $table->unique(['community_post_id', 'user_id'], 'claims_community_post_id_user_id_unique');
            $table->unique(['item_id', 'user_id'], 'claims_item_id_user_id_unique');
        });
    }

    public function down(): void
    {
        Schema::table('claims', function (Blueprint $table) {
            $table->dropForeign(['item_id']);
            $table->dropUnique('claims_community_post_id_user_id_unique');
            $table->dropUnique('claims_item_id_user_id_unique');
            $table->dropConstrainedForeignId('community_post_id');
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE claims MODIFY item_id BIGINT UNSIGNED NOT NULL');
        } else {
            Schema::table('claims', function (Blueprint $table) {
                $table->unsignedBigInteger('item_id')->nullable(false)->change();
            });
        }

        Schema::table('claims', function (Blueprint $table) {
            $table->foreign('item_id')->references('id')->on('items')->cascadeOnDelete();
            $table->unique(['item_id', 'user_id'], 'claims_item_id_user_id_unique');
        });
    }
};
