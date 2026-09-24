<?php

namespace Database\Factories;

use App\Enums\Availability;
use App\Enums\ProfileSource;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProfileFactory extends Factory
{
    public function definition(): array
    {
        return ['first_name' => fake()->firstName(), 'last_name' => fake()->lastName(), 'email' => fake()->unique()->safeEmail(), 'phone' => null, 'company' => 'Entreprise fictive', 'job_title' => 'Direction', 'joined_at' => now(), 'source' => ProfileSource::Manual, 'availability' => Availability::Unspecified];
    }
}
