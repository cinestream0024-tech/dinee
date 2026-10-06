<?php

namespace Database\Factories;

use App\Enums\RecommendationStatus;
use App\Models\Profile;
use Illuminate\Database\Eloquent\Factories\Factory;

class RecommendationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'recommender_profile_id' => Profile::factory(),
            'name' => fake()->name(),
            'job_title' => 'Direction',
            'company' => 'Entreprise fictive',
            'email' => fake()->unique()->safeEmail(),
            'phone' => null,
            'linkedin_url' => null,
            'reason' => 'Cette personne apporterait une expérience utile au réseau.',
            'status' => RecommendationStatus::Pending,
        ];
    }
}
