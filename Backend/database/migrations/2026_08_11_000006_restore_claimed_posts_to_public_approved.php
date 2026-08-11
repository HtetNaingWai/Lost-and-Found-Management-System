<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('community_posts')
            ->where('status', 'claimed')
            ->whereNull('returned_at')
            ->update([
                'status' => 'approved',
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        // Intentionally no-op: claim state belongs to claims, not public item visibility.
    }
};
