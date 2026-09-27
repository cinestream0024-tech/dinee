<?php

namespace App\Services;

use App\Enums\EventStatus;
use App\Enums\InvitationStatus;
use App\Models\Event;
use App\Models\EventSelection;
use App\Models\Invitation;
use App\Support\InvitationToken;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InvitationService
{
    public function create(Event $event, EventSelection $selection): array
    {
        return DB::transaction(function () use ($event, $selection) {
            $event = Event::lockForUpdate()->findOrFail($event->id);
            $selection = EventSelection::lockForUpdate()->findOrFail($selection->id);
            $this->assertInvitable($event, $selection);

            $existing = Invitation::where('event_selection_id', $selection->id)->first();
            if ($existing) {
                return ['invitation' => $existing->load('selection.profile', 'selection.event'), 'plain_text_token' => null];
            }

            $token = InvitationToken::issue();
            $invitation = new Invitation;
            $invitation->forceFill([
                'event_selection_id' => $selection->id,
                'status' => InvitationStatus::Pending,
                'token_hash' => $token['hash'],
                'token_expires_at' => $event->starts_at,
            ])->save();

            return [
                'invitation' => $invitation->load('selection.profile', 'selection.event'),
                'plain_text_token' => $token['plain_text'],
            ];
        });
    }

    public function markSent(Invitation $invitation): Invitation
    {
        return DB::transaction(function () use ($invitation) {
            [$event, $selection, $invitation] = $this->lockContext($invitation);
            $this->assertActiveFutureContext($event, $selection);

            if ($invitation->status === InvitationStatus::Cancelled) {
                throw ValidationException::withMessages(['status' => ['cancelled_invitation']]);
            }
            if ($invitation->token_revoked_at || $invitation->token_expires_at->isPast()) {
                throw ValidationException::withMessages(['token' => ['valid_token_required']]);
            }
            if (! $invitation->sent_at) {
                $invitation->forceFill(['sent_at' => now()])->save();
            }

            return $invitation->load('selection.profile', 'selection.event');
        });
    }

    public function cancel(Invitation $invitation): Invitation
    {
        return DB::transaction(function () use ($invitation) {
            [, , $invitation] = $this->lockContext($invitation);
            if ($invitation->status !== InvitationStatus::Cancelled) {
                $invitation->forceFill([
                    'status' => InvitationStatus::Cancelled,
                    'token_revoked_at' => now(),
                ])->save();
            }

            return $invitation->load('selection.profile', 'selection.event');
        });
    }

    private function assertInvitable(Event $event, EventSelection $selection): void
    {
        $errors = [];
        if ($event->status !== EventStatus::Upcoming || ! $event->starts_at?->isFuture()) {
            $errors['event'] = ['upcoming_future_event_required'];
        }
        if ($selection->event_id !== $event->id) {
            $errors['selection_id'] = ['selection_event_mismatch'];
        } elseif ($selection->withdrawn_at) {
            $errors['selection_id'] = ['active_selection_required'];
        }
        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function assertActiveFutureContext(Event $event, EventSelection $selection): void
    {
        if ($event->status !== EventStatus::Upcoming || ! $event->starts_at?->isFuture() || $selection->withdrawn_at) {
            throw ValidationException::withMessages(['invitation' => ['active_future_invitation_required']]);
        }
    }

    private function lockContext(Invitation $invitation): array
    {
        $snapshot = Invitation::with('selection')->findOrFail($invitation->id);
        $event = Event::lockForUpdate()->findOrFail($snapshot->selection->event_id);
        $selection = EventSelection::lockForUpdate()->findOrFail($snapshot->event_selection_id);
        $locked = Invitation::lockForUpdate()->findOrFail($snapshot->id);

        return [$event, $selection, $locked];
    }
}
