<?php

namespace Database\Seeders;

use App\Enums\EventStatus;
use App\Enums\UserRole;
use App\Models\Event;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            throw new RuntimeException('Demo data is restricted to local and testing environments.');
        }
        $password = config('dinee.demo_password');
        if (! is_string($password) || strlen($password) < 12) {
            throw new RuntimeException('Set DINEE_DEMO_PASSWORD to at least 12 characters in the local .env.');
        }
        DB::transaction(function () use ($password) {
            $admin = User::firstOrCreate(['email' => 'yannick@dinee.test'], ['name' => 'Yannick Démo', 'password' => $password, 'role' => UserRole::Admin, 'email_verified_at' => now()]);
            $member = User::firstOrCreate(['email' => 'patrick@dinee.test'], ['name' => 'Patrick Démo', 'password' => $password, 'role' => UserRole::Member, 'email_verified_at' => now()]);
            foreach ([['Patrick', 'patrick@dinee.test', $member->id], ['Sarah', 'sarah@dinee.test', null], ['Alex', 'alex@dinee.test', null]] as [$name, $email, $userId]) {
                Profile::firstOrCreate(['email' => $email], ['first_name' => $name, 'last_name' => 'Démo', 'user_id' => $userId, 'company' => 'Entreprise fictive', 'job_title' => 'Direction', 'joined_at' => now(), 'created_by' => $admin->id]);
            }
            foreach ([['DINEE démo — prochaine édition', now()->addMonth(), EventStatus::Upcoming], ['DINEE démo — édition passée', now()->subMonth(), EventStatus::Completed]] as [$title, $date, $status]) {
                Event::firstOrCreate(['title' => $title], ['starts_at' => $date, 'timezone' => 'Africa/Kinshasa', 'location' => 'Lieu fictif — Kinshasa', 'capacity' => 30, 'status' => $status, 'created_by' => $admin->id]);
            }
        });
    }
}
