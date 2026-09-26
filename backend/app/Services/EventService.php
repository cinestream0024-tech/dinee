<?php

namespace App\Services;

use App\Enums\EventStatus;
use App\Models\Event;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class EventService
{
    public function save(array $data, User $actor, ?Event $event = null): Event
    {
        return DB::transaction(function () use ($data, $actor, $event) {
            $record = $event ? Event::lockForUpdate()->findOrFail($event->id) : new Event;
            $status = EventStatus::from($data['status']);
            if ($record->exists) {
                $allowed = match ($record->status) {
                    EventStatus::Draft => [EventStatus::Draft, EventStatus::Upcoming, EventStatus::Cancelled],
                    EventStatus::Upcoming => [EventStatus::Upcoming, EventStatus::Completed, EventStatus::Cancelled],
                    default => [],
                };
            } else {
                $allowed = [EventStatus::Draft, EventStatus::Upcoming];
            }
            if (! in_array($status, $allowed, true)) {
                throw ValidationException::withMessages(['status' => ['invalid_transition']]);
            }
            $startsAt = ! empty($data['starts_at_local']) ? CarbonImmutable::createFromFormat('Y-m-d\TH:i', $data['starts_at_local'], $data['timezone'])->startOfMinute()->utc() : null;
            if ($status === EventStatus::Upcoming) {
                $errors = [];
                if (! $startsAt || ! $startsAt->isFuture()) {
                    $errors['starts_at_local'] = ['future_event_required'];
                }
                if (empty($data['location'])) {
                    $errors['location'] = ['location_required'];
                }
                if ($errors !== []) {
                    throw ValidationException::withMessages($errors);
                }
            }
            if ($status === EventStatus::Completed && (! $record->starts_at || $record->starts_at->isFuture())) {
                throw ValidationException::withMessages(['status' => ['event_not_started']]);
            }
            if ($record->exists && $record->selections()->whereHas('invitation')->exists()) {
                abort(409, 'Invited events require the invitation workflow before editing.');
            }
            if ($record->exists && $status === EventStatus::Completed) {
                // Closing an event must not rewrite its historical date.
                $startsAt = $record->starts_at;
                $data['timezone'] = $record->timezone;
            }
            $record->fill(collect($data)->except(['status', 'starts_at_local'])->all());
            $record->forceFill(['status' => $status, 'starts_at' => $startsAt]);
            if (! $record->exists) {
                $record->created_by = $actor->id;
            }
            $record->save();

            return $record->refresh()->loadCount('activeSelections');
        });
    }
}
