<?php

namespace Database\Factories;

use App\Enums\EventStatus;
use App\Models\Event;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EventSelectionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'event_id' => Event::factory()->state([
                'status' => EventStatus::Upcoming,
                'starts_at' => now()->addMonth(),
            ]),
            'profile_id' => Profile::factory(),
            'selected_by' => User::factory()->admin(),
            'selected_at' => now(),
            'withdrawn_at' => null,
        ];
    }
}
