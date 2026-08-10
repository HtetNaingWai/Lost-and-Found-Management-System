<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('messages') || !Schema::hasColumn('messages', 'message')) {
            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE messages MODIFY message TEXT NULL');
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('messages') || !Schema::hasColumn('messages', 'message')) {
            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE messages MODIFY message TEXT NOT NULL');
        }
    }
};
