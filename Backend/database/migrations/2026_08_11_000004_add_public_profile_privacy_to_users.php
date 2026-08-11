<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('show_phone_publicly')->default(false)->after('ban_reason');
            $table->boolean('show_email_publicly')->default(false)->after('show_phone_publicly');
            $table->boolean('show_location_publicly')->default(false)->after('show_email_publicly');
            $table->string('public_location', 120)->nullable()->after('show_location_publicly');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'show_phone_publicly',
                'show_email_publicly',
                'show_location_publicly',
                'public_location',
            ]);
        });
    }
};
