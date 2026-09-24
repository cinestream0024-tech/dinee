<?php

namespace App\Policies;

use App\Models\Profile;
use App\Models\User;

class ProfilePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, Profile $profile): bool
    {
        return $user->isAdmin() || $profile->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Profile $profile): bool
    {
        return $this->view($user, $profile);
    }

    public function delete(User $user, Profile $profile): bool
    {
        return false;
    }
}
