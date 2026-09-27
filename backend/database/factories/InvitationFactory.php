<?php

namespace Database\Factories;

use App\Enums\InvitationStatus;
use App\Models\EventSelection;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvitationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'event_selection_id' => EventSelection::factory(),
            'status' => InvitationStatus::Pending,
            'sent_at' => null,
            'responded_at' => null,
            'future_interest' => null,
            'token_hash' => hash('sha256', random_bytes(32)),
            'token_expires_at' => now()->addMonth(),
            'token_revoked_at' => null,
        ];
    }

    public function sent(): static
    {
        return $this->state(fn () => ['sent_at' => now()]);
    }
}
