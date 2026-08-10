<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE contact_messages MODIFY status ENUM('new', 'read', 'replied', 'pending', 'in_progress', 'resolved') NOT NULL DEFAULT 'pending'");
        }

        DB::table('contact_messages')
            ->where('status', 'new')
            ->update(['status' => 'pending']);

        DB::table('contact_messages')
            ->whereIn('status', ['read', 'replied'])
            ->update(['status' => 'in_progress']);

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE contact_messages MODIFY status ENUM('pending', 'in_progress', 'resolved') NOT NULL DEFAULT 'pending'");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE contact_messages MODIFY status ENUM('new', 'read', 'replied', 'pending', 'in_progress', 'resolved') NOT NULL DEFAULT 'new'");
        }

        DB::table('contact_messages')
            ->where('status', 'pending')
            ->update(['status' => 'new']);

        DB::table('contact_messages')
            ->where('status', 'in_progress')
            ->update(['status' => 'read']);

        DB::table('contact_messages')
            ->where('status', 'resolved')
            ->update(['status' => 'replied']);

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE contact_messages MODIFY status ENUM('new', 'read', 'replied') NOT NULL DEFAULT 'new'");
        }
    }
};
