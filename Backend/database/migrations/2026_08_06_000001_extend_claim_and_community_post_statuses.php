<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE community_posts MODIFY status ENUM('pending', 'approved', 'rejected', 'claimed', 'returned') NOT NULL DEFAULT 'pending'");
        DB::statement("ALTER TABLE claims MODIFY status ENUM('pending', 'approved', 'rejected', 'returned') NOT NULL DEFAULT 'pending'");

        Schema::table('community_posts', function (Blueprint $table) {
            $table->timestamp('returned_at')->nullable()->after('rejected_at');
        });

        Schema::table('claims', function (Blueprint $table) {
            $table->timestamp('returned_at')->nullable()->after('reviewed_at');
        });
    }

    public function down(): void
    {
        DB::table('community_posts')
            ->whereIn('status', ['claimed', 'returned'])
            ->update(['status' => 'approved']);

        DB::table('claims')
            ->where('status', 'returned')
            ->update(['status' => 'approved']);

        Schema::table('community_posts', function (Blueprint $table) {
            $table->dropColumn('returned_at');
        });

        Schema::table('claims', function (Blueprint $table) {
            $table->dropColumn('returned_at');
        });

        DB::statement("ALTER TABLE community_posts MODIFY status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending'");
        DB::statement("ALTER TABLE claims MODIFY status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending'");
    }
};
