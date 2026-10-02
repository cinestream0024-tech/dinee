<?php

namespace App\Services;

use App\Enums\ProfileSource;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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

    public function replacePhoto(Profile $profile, UploadedFile $photo): Profile
    {
        $newPath = $photo->store('profile-photos', 'local');
        abort_unless($newPath, 500);

        try {
            [$record, $oldPath] = DB::transaction(function () use ($profile, $newPath) {
                $record = Profile::lockForUpdate()->findOrFail($profile->id);
                $oldPath = $record->photo_path;
                $record->forceFill(['photo_path' => $newPath])->save();

                return [$record->refresh(), $oldPath];
            });
        } catch (\Throwable $exception) {
            Storage::disk('local')->delete($newPath);
            throw $exception;
        }

        if ($oldPath) {
            Storage::disk('local')->delete($oldPath);
        }

        return $record;
    }

    public function removePhoto(Profile $profile): Profile
    {
        [$record, $oldPath] = DB::transaction(function () use ($profile) {
            $record = Profile::lockForUpdate()->findOrFail($profile->id);
            $oldPath = $record->photo_path;
            $record->forceFill(['photo_path' => null])->save();

            return [$record->refresh(), $oldPath];
        });

        if ($oldPath) {
            Storage::disk('local')->delete($oldPath);
        }

        return $record;
    }

    public function history(Profile $profile): array
    {
        return $profile->selections()->with(['event', 'invitation', 'attendance'])->get()
            ->sortByDesc(fn ($selection) => $selection->event->starts_at)->values()->map(fn ($selection) => [
                'event_id' => $selection->event_id, 'event_title' => $selection->event->title,
                'starts_at' => $selection->event->starts_at?->toISOString(),
                'timezone' => $selection->event->timezone,
                'location' => $selection->event->location,
                'event_status' => $selection->event->status->value,
                'status' => $selection->withdrawn_at ? 'withdrawn' : ($selection->attendance?->status->value ?? $selection->invitation?->status->value ?? 'selected'),
                'invitation_status' => $selection->invitation?->status->value,
                'attendance_status' => $selection->attendance?->status->value,
                'selected_at' => $selection->selected_at->toISOString(),
            ])->all();
    }
}
