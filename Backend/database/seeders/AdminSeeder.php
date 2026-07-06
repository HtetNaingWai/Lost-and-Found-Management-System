<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@findit.com'],
            [
                'name' => 'Admin',
                'phone' => null,
                'nrc_no' => null,
                'nrc_front_photo' => null,
                'nrc_back_photo' => null,
                'profile_image' => null,
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'status' => 'active',
            ],
        );
    }
}
