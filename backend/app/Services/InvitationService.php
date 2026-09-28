<?php

namespace App\Services;

use App\Enums\EventStatus;
use App\Enums\InvitationStatus;
use App\Models\Event;
use App\Models\EventSelection;
use App\Models\Invitation;
use App\Models\InvitationFollowUp;
use App\Models\User;
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

    public function findPublic(string $plainTextToken): Invitation
    {
        $invitation = $this->findByPlainTextToken($plainTextToken)
            ->load('selection.event');
        $this->assertPubliclyAccessible($invitation, $invitation->selection->event, $invitation->selection);

        return $invitation;
    }

    public function respond(string $plainTextToken, InvitationStatus $status, ?bool $futureInterest): Invitation
    {
        if (! in_array($status, [InvitationStatus::Accepted, InvitationStatus::Declined], true)) {
            throw new \InvalidArgumentException('Unsupported invitation response.');
        }

        return DB::transaction(function () use ($plainTextToken, $status, $futureInterest) {
            $snapshot = $this->findByPlainTextToken($plainTextToken);
            [$event, $selection, $invitation] = $this->lockContext($snapshot);
            if (! hash_equals($invitation->token_hash, InvitationToken::hash($plainTextToken))) {
                abort(404);
            }
            $this->assertPubliclyAccessible($invitation, $event, $selection);

            $normalizedInterest = $status === InvitationStatus::Declined ? $futureInterest : null;
            if ($invitation->status === $status && $invitation->future_interest === $normalizedInterest) {
                return $invitation->load('selection.event');
            }

            $invitation->forceFill([
                'status' => $status,
                'future_interest' => $normalizedInterest,
                'responded_at' => now(),
            ])->save();

            return $invitation->load('selection.event');
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
            if ($invitation->token_revoked_at || $invitation->token_expires_at->lessThanOrEqualTo(now())) {
                throw ValidationException::withMessages(['token' => ['valid_token_required']]);
            }
            if (! $invitation->sent_at) {
                $invitation->forceFill(['sent_at' => now()])->save();
            }

            return $invitation->load('selection.profile', 'selection.event');
        });
    }

    /**
     * @return array{invitation: Invitation, plain_text_token: string}
     */
    public function rotateToken(Invitation $invitation): array
    {
        return DB::transaction(function () use ($invitation) {
            [$event, $selection, $invitation] = $this->lockContext($invitation);
            $this->assertActiveFutureContext($event, $selection);

            if ($invitation->status === InvitationStatus::Cancelled) {
                throw ValidationException::withMessages(['status' => ['cancelled_invitation']]);
            }

            $token = InvitationToken::issue();
            $invitation->forceFill([
                'token_hash' => $token['hash'],
                'token_expires_at' => $event->starts_at,
                'token_revoked_at' => null,
            ])->save();

            return [
                'invitation' => $invitation->load('selection.profile', 'selection.event'),
                'plain_text_token' => $token['plain_text'],
            ];
        });
    }

    public function recordFollowUp(Invitation $invitation, User $recordedBy, string $operationId): Invitation
    {
        return DB::transaction(function () use ($invitation, $recordedBy, $operationId) {
            [$event, $selection, $invitation] = $this->lockContext($invitation);

            $existing = InvitationFollowUp::where('operation_id', $operationId)->first();
            if ($existing) {
                if ($existing->invitation_id !== $invitation->id || $existing->recorded_by !== $recordedBy->id) {
                    throw ValidationException::withMessages(['operation_id' => ['operation_id_already_used']]);
                }

                return $this->loadFollowUpState($invitation);
            }

            $this->assertActiveFutureContext($event, $selection);
            if ($invitation->status !== InvitationStatus::Pending || ! $invitation->sent_at) {
                throw ValidationException::withMessages(['invitation' => ['pending_sent_invitation_required']]);
            }
            if (! Invitation::query()->whereKey($invitation->id)->dueForFollowUp()->exists()) {
                throw ValidationException::withMessages(['invitation' => ['follow_up_not_due']]);
            }

            InvitationFollowUp::query()->forceCreate([
                'invitation_id' => $invitation->id,
                'recorded_by' => $recordedBy->id,
                'sent_at' => now(),
                'operation_id' => $operationId,
            ]);

            return $this->loadFollowUpState($invitation);
        });
    }

    public function revokeToken(Invitation $invitation): Invitation
    {
        return DB::transaction(function () use ($invitation) {
            [, , $invitation] = $this->lockContext($invitation);

            if (! $invitation->token_revoked_at) {
                $invitation->forceFill(['token_revoked_at' => now()])->save();
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

    private function loadFollowUpState(Invitation $invitation): Invitation
    {
        return $invitation->fresh()
            ->load('selection.profile', 'selection.event')
            ->loadCount('followUps')
            ->loadMax('followUps', 'sent_at');
    }

    private function findByPlainTextToken(string $plainTextToken): Invitation
    {
        if (! InvitationToken::hasValidFormat($plainTextToken)) {
            abort(404);
        }

        return Invitation::where('token_hash', InvitationToken::hash($plainTextToken))->firstOrFail();
    }

    private function assertPubliclyAccessible(Invitation $invitation, Event $event, EventSelection $selection): void
    {
        if (
            $invitation->status === InvitationStatus::Cancelled
            || $invitation->token_revoked_at
            || $invitation->token_expires_at->lessThanOrEqualTo(now())
            || $event->status !== EventStatus::Upcoming
            || ! $event->starts_at?->isFuture()
            || $selection->withdrawn_at
        ) {
            abort(404);
        }
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
