<?php

namespace Tests\Feature;

use App\Enums\EventStatus;
use App\Enums\InvitationStatus;
use App\Models\Event;
use App\Models\EventSelection;
use App\Models\Invitation;
use App\Models\User;
use App\Support\InvitationToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PublicInvitationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_view_only_safe_event_information_with_a_valid_token(): void
    {
        [$token, $invitation] = $this->invitation();

        $this->getJson("/api/v1/public/invitations/{$token}")
            ->assertOk()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.event.title', 'DINEE privé')
            ->assertJsonPath('data.event.location', 'Lieu fictif')
            ->assertJsonPath('data.can_activate_account', false)
            ->assertJsonMissingPath('data.profile')
            ->assertJsonMissingPath('data.selection')
            ->assertJsonMissingPath('data.token_hash')
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertHeader('Referrer-Policy', 'no-referrer');

        $this->assertNull($invitation->fresh()->responded_at);
    }

    public function test_guest_accepts_without_an_account_and_repeating_is_idempotent(): void
    {
        [$token, $invitation] = $this->invitation();

        $respondedAt = $this->postJson("/api/v1/public/invitations/{$token}/response", [
            'response' => 'accepted',
        ])->assertOk()
            ->assertJsonPath('data.status', 'accepted')
            ->assertJsonPath('data.can_activate_account', true)
            ->assertJsonPath('data.future_interest', null)
            ->json('data.responded_at');

        $this->assertNotNull($respondedAt);
        $this->postJson("/api/v1/public/invitations/{$token}/response", [
            'response' => 'accepted',
        ])->assertOk()->assertJsonPath('data.responded_at', $respondedAt);

        $invitation->refresh();
        $this->assertSame(InvitationStatus::Accepted, $invitation->status);
        $this->assertNull($invitation->future_interest);
    }

    public function test_guest_activates_a_member_account_after_responding_and_is_signed_in(): void
    {
        [$token, $invitation] = $this->invitation();
        $profile = $invitation->selection->profile;

        $this->postJson("/api/v1/public/invitations/{$token}/response", [
            'response' => 'accepted',
        ])->assertOk();

        $this->postJson("/api/v1/public/invitations/{$token}/activate", [
            'email' => 'nouveau.membre@example.test',
            'password' => 'DineeMembre2026',
            'password_confirmation' => 'DineeMembre2026',
        ])->assertCreated()
            ->assertJsonPath('data.role', 'member')
            ->assertJsonPath('data.profile_id', $profile->id);

        $user = User::query()->where('email', 'nouveau.membre@example.test')->firstOrFail();
        $this->assertAuthenticatedAs($user);
        $this->assertSame($user->id, $profile->fresh()->user_id);
        $this->assertTrue(Hash::check('DineeMembre2026', $user->password));
        $this->assertNotNull($invitation->fresh()->token_revoked_at);
    }

    public function test_account_activation_requires_a_response_and_cannot_be_replayed(): void
    {
        [$token, $invitation] = $this->invitation();
        $initialUserCount = User::query()->count();
        $payload = [
            'email' => 'nouveau.membre@example.test',
            'password' => 'DineeMembre2026',
            'password_confirmation' => 'DineeMembre2026',
        ];

        $this->postJson("/api/v1/public/invitations/{$token}/activate", $payload)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('invitation');
        $this->assertDatabaseCount('users', $initialUserCount);

        $invitation->forceFill(['status' => InvitationStatus::Accepted, 'responded_at' => now()])->save();
        $this->postJson("/api/v1/public/invitations/{$token}/activate", $payload)->assertCreated();
        $this->postJson("/api/v1/public/invitations/{$token}/activate", $payload)->assertForbidden();
        $this->assertDatabaseCount('users', $initialUserCount + 1);
    }

    public function test_authenticated_user_cannot_activate_another_invitation_account(): void
    {
        [$token, $invitation] = $this->invitation();
        $invitation->forceFill(['status' => InvitationStatus::Accepted, 'responded_at' => now()])->save();
        $existingUser = User::factory()->create();

        $this->actingAs($existingUser)->postJson("/api/v1/public/invitations/{$token}/activate", [
            'email' => 'autre.membre@example.test',
            'password' => 'DineeMembre2026',
            'password_confirmation' => 'DineeMembre2026',
        ])->assertForbidden();

        $this->assertNull($invitation->selection->profile->fresh()->user_id);
        $this->assertNull($invitation->fresh()->token_revoked_at);
    }

    public function test_decline_requires_future_interest_and_response_can_be_corrected(): void
    {
        [$token, $invitation] = $this->invitation();

        $this->postJson("/api/v1/public/invitations/{$token}/response", [
            'response' => 'declined',
        ])->assertUnprocessable()->assertJsonValidationErrors('future_interest');
        $this->assertSame(InvitationStatus::Pending, $invitation->fresh()->status);

        $this->postJson("/api/v1/public/invitations/{$token}/response", [
            'response' => 'declined',
            'future_interest' => true,
        ])->assertOk()
            ->assertJsonPath('data.status', 'declined')
            ->assertJsonPath('data.future_interest', true);

        $this->postJson("/api/v1/public/invitations/{$token}/response", [
            'response' => 'accepted',
            'future_interest' => true,
        ])->assertUnprocessable()->assertJsonValidationErrors('future_interest');
        $this->postJson("/api/v1/public/invitations/{$token}/response", [
            'response' => 'accepted',
        ])->assertOk()
            ->assertJsonPath('data.status', 'accepted')
            ->assertJsonPath('data.future_interest', null);

        $this->assertNull($invitation->fresh()->future_interest);
    }

    public function test_invalid_revoked_expired_cancelled_or_inactive_links_are_indistinguishable(): void
    {
        $this->getJson('/api/v1/public/invitations/not-a-token')->assertNotFound();
        [$token, $invitation] = $this->invitation();

        $invitation->forceFill(['token_revoked_at' => now()])->save();
        $this->getJson("/api/v1/public/invitations/{$token}")->assertNotFound();
        $invitation->forceFill(['token_revoked_at' => null, 'token_expires_at' => now()])->save();
        $this->getJson("/api/v1/public/invitations/{$token}")->assertNotFound();
        $invitation->forceFill(['token_expires_at' => now()->addMonth(), 'status' => InvitationStatus::Cancelled])->save();
        $this->getJson("/api/v1/public/invitations/{$token}")->assertNotFound();
        $invitation->forceFill(['status' => InvitationStatus::Pending])->save();
        $invitation->selection->forceFill(['withdrawn_at' => now()])->save();
        $this->getJson("/api/v1/public/invitations/{$token}")->assertNotFound();
        $invitation->selection->forceFill(['withdrawn_at' => null])->save();
        $invitation->selection->event->forceFill(['status' => EventStatus::Completed])->save();
        $this->postJson("/api/v1/public/invitations/{$token}/response", ['response' => 'accepted'])->assertNotFound();

        $this->assertSame(InvitationStatus::Pending, $invitation->fresh()->status);
        $this->assertNull($invitation->fresh()->responded_at);
    }

    public function test_public_invitation_endpoints_are_rate_limited_per_link_and_ip(): void
    {
        [$token] = $this->invitation();

        for ($attempt = 1; $attempt <= 10; $attempt++) {
            $this->getJson("/api/v1/public/invitations/{$token}")->assertOk();
        }
        $this->getJson("/api/v1/public/invitations/{$token}")->assertTooManyRequests();
    }

    private function invitation(): array
    {
        $event = Event::factory()->create([
            'title' => 'DINEE privé',
            'location' => 'Lieu fictif',
            'description' => 'Rencontre professionnelle privée.',
            'status' => EventStatus::Upcoming,
            'starts_at' => now()->addMonth(),
        ]);
        $selection = EventSelection::factory()->for($event)->create();
        $token = InvitationToken::issue();
        $invitation = Invitation::factory()->for($selection, 'selection')->create([
            'token_hash' => $token['hash'],
            'token_expires_at' => $event->starts_at,
        ]);

        return [$token['plain_text'], $invitation];
    }
}
