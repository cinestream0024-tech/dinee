<?php

namespace App\Models;

use App\Enums\EventStatus;
use App\Enums\InvitationStatus;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
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
            'follow_ups_max_sent_at' => 'immutable_datetime',
        ];
    }

    public function scopeDueForFollowUp(Builder $query, ?CarbonInterface $at = null): Builder
    {
        $at ??= now();
        $cutoff = $at->copy()->subHours($this->followUpDelayHours());

        return $query
            ->where('status', InvitationStatus::Pending)
            ->whereNotNull('sent_at')
            ->where('sent_at', '<=', $cutoff)
            ->whereHas('selection', fn (Builder $selection) => $selection
                ->whereNull('withdrawn_at')
                ->whereHas('event', fn (Builder $event) => $event
                    ->where('status', EventStatus::Upcoming)
                    ->where('starts_at', '>', $at)))
            ->whereDoesntHave('followUps', fn (Builder $followUp) => $followUp
                ->where('sent_at', '>', $cutoff));
    }

    public function isDueForFollowUp(?CarbonInterface $at = null): bool
    {
        $at ??= now();
        $this->loadMissing('selection.event');

        if (
            $this->status !== InvitationStatus::Pending
            || ! $this->sent_at
            || $this->selection->withdrawn_at
            || $this->selection->event->status !== EventStatus::Upcoming
            || ! $this->selection->event->starts_at?->isAfter($at)
        ) {
            return false;
        }

        if (array_key_exists('follow_ups_max_sent_at', $this->getAttributes())) {
            $lastFollowUpAt = $this->follow_ups_max_sent_at;
        } else {
            $latestFollowUp = $this->followUps()->max('sent_at');
            $lastFollowUpAt = $latestFollowUp ? CarbonImmutable::parse($latestFollowUp) : null;
        }
        $lastContactAt = $lastFollowUpAt ?? $this->sent_at;

        return $lastContactAt->lessThanOrEqualTo($at->copy()->subHours($this->followUpDelayHours()));
    }

    private function followUpDelayHours(): int
    {
        return max(1, (int) config('dinee.follow_up_delay_hours', 48));
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
