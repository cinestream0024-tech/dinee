<?php

namespace App\Models;

use App\Enums\InvitationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invitation extends Model
{
    protected $guarded = ['*'];

    protected $hidden = ['token_hash'];

    protected function casts(): array
    {
        return ['status' => InvitationStatus::class, 'sent_at' => 'datetime', 'responded_at' => 'datetime', 'future_interest' => 'boolean', 'token_expires_at' => 'datetime', 'token_revoked_at' => 'datetime'];
    }

    public function selection(): BelongsTo
    {
        return $this->belongsTo(EventSelection::class, 'event_selection_id');
    }

    public function followUps(): HasMany
    {
        return $this->hasMany(InvitationFollowUp::class);
    }
}
