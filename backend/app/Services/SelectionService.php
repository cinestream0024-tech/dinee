<?php

namespace App\Services;

use App\Enums\EventStatus;
use App\Models\Event;
use App\Models\EventSelection;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SelectionService
{
    public function select(Event $event, Profile $profile, User $actor): EventSelection
    {
        return DB::transaction(function () use ($event, $profile, $actor) {
            $event = Event::lockForUpdate()->findOrFail($event->id);
            $this->assertSelectable($event);
            $selection = EventSelection::where('event_id', $event->id)->where('profile_id', $profile->id)->first();
            if ($selection && ! $selection->withdrawn_at) {
                return $selection->load('profile');
            }
            if ($selection?->invitation()->exists()) {
                abort(409, 'Invitation workflow required.');
            }
            $selection ??= new EventSelection;
            $selection->forceFill(['event_id' => $event->id, 'profile_id' => $profile->id, 'selected_by' => $actor->id, 'selected_at' => now(), 'withdrawn_at' => null])->save();

            return $selection->load('profile');
        });
    }

    public function withdraw(Event $event, Profile $profile): void
    {
        DB::transaction(function () use ($event, $profile) {
            $event = Event::lockForUpdate()->findOrFail($event->id);
            $this->assertSelectable($event);
            $selection = EventSelection::where('event_id', $event->id)->where('profile_id', $profile->id)->firstOrFail();
            if ($selection->invitation()->exists() || $selection->attendance()->exists()) {
                abort(409, 'Invitation or attendance workflow required.');
            }
            if (! $selection->withdrawn_at) {
                $selection->forceFill(['withdrawn_at' => now()])->save();
            }
        });
    }

    private function assertSelectable(Event $event): void
    {
        if (! in_array($event->status, [EventStatus::Draft, EventStatus::Upcoming], true) || ! $event->starts_at?->isFuture()) {
            throw ValidationException::withMessages(['event' => ['future_event_required']]);
        }
    }
}
