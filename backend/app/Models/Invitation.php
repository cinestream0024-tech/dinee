<?php

namespace App\Models;

use App\Enums\InvitationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invitation extends Model
{
    use HasFactory;

    protected $guarded = ['*'];

    protected $hidden = ['token_hash'];

    protected function casts(): array
    {
        return [
            'status' => InvitationStatus::class,
            'sent_at' => 'immutable_datetime',
            'responded_at' => 'immutable_datetime',
            'future_interest' => 'boolean',
            'token_expires_at' => 'immutable_datetime',
            'token_revoked_at' => 'immutable_datetime',
        ];
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
