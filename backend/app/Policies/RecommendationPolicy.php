<?php

namespace App\Policies;

use App\Models\Recommendation;
use App\Models\User;

class RecommendationPolicy
{
    public function create(User $user): bool
    {
        return ! $user->isAdmin() && $user->profile()->exists();
    }

    public function view(User $user, Recommendation $recommendation): bool
    {
        return $user->isAdmin() || $recommendation->recommender_profile_id === $user->profile?->id;
    }

    public function review(User $user): bool
    {
        return $user->isAdmin();
    }
}
