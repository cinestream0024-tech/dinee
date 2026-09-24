<?php

namespace Database\Factories;

use App\Enums\EventStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EventFactory extends Factory
{
    public function definition(): array
    {
        return ['title' => 'DINEE démo '.fake()->unique()->numberBetween(1, 10000), 'starts_at' => now()->addMonth(), 'timezone' => 'Africa/Kinshasa', 'location' => 'Lieu fictif — Kinshasa', 'capacity' => 30, 'status' => EventStatus::Draft, 'created_by' => User::factory()->admin()];
    }
}
