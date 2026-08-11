<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY status ENUM('active', 'disabled', 'banned') NOT NULL DEFAULT 'active'");
        }

        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('banned_at')->nullable()->after('status');
            $table->text('ban_reason')->nullable()->after('banned_at');
        });
    }

    public function down(): void
    {
        DB::table('users')
            ->where('status', 'banned')
            ->update([
                'status' => 'disabled',
                'banned_at' => null,
                'ban_reason' => null,
            ]);

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['banned_at', 'ban_reason']);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY status ENUM('active', 'disabled') NOT NULL DEFAULT 'active'");
        }
    }
};
