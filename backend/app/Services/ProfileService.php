<?php

namespace App\Services;

use App\Enums\ProfileSource;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProfileService
{
    public function save(array $data, User $actor, ?Profile $profile = null, ProfileSource $source = ProfileSource::Manual): Profile
    {
        try {
            return DB::transaction(function () use ($data, $actor, $profile, $source) {
                $record = $profile ? Profile::lockForUpdate()->findOrFail($profile->id) : new Profile;
                $record->fill($data);
                if (! $record->exists) {
                    $record->forceFill(['created_by' => $actor->id, 'joined_at' => now(), 'source' => $source]);
                }
                $record->save();

                return $record->refresh();
            });
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages(['contact' => ['duplicate_contact']]);
        }
    }

    public function history(Profile $profile): array
    {
        return $profile->selections()->with(['event', 'invitation', 'attendance'])->get()
            ->sortByDesc(fn ($selection) => $selection->event->starts_at)->values()->map(fn ($selection) => [
                'event_id' => $selection->event_id, 'event_title' => $selection->event->title,
                'starts_at' => $selection->event->starts_at?->toISOString(),
                'event_status' => $selection->event->status->value,
                'status' => $selection->withdrawn_at ? 'withdrawn' : ($selection->attendance?->status->value ?? $selection->invitation?->status->value ?? 'selected'),
                'selected_at' => $selection->selected_at->toISOString(),
            ])->all();
    }
}
