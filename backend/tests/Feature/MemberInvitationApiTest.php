<?php

namespace Tests\Feature;

use App\Enums\EventStatus;
use App\Enums\InvitationStatus;
use App\Models\Event;
use App\Models\EventSelection;
use App\Models\Invitation;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemberInvitationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_invitation_routes_require_a_member(): void
    {
        $this->getJson('/api/v1/member/invitations')->assertUnauthorized();

        $this->actingAs(User::factory()->admin()->create())
            ->getJson('/api/v1/member/invitations')
            ->assertForbidden();
    }

    public function test_member_sees_only_their_sent_invitations_without_tokens(): void
    {
        $admin = User::factory()->admin()->create();
        $member = User::factory()->create();
        $profile = Profile::factory()->create(['user_id' => $member->id]);
        $otherProfile = Profile::factory()->create();
        $event = Event::factory()->create([
            'created_by' => $admin->id,
            'starts_at' => now()->addWeek(),
            'status' => EventStatus::Upcoming,
        ]);
        $unsentEvent = Event::factory()->create([
            'created_by' => $admin->id,
            'starts_at' => now()->addWeeks(2),
            'status' => EventStatus::Upcoming,
        ]);

        $own = $this->invitation($event, $profile, $admin, ['sent_at' => now()]);
        $this->invitation($unsentEvent, $profile, $admin);
        $this->invitation($event, $otherProfile, $admin, ['sent_at' => now()]);

        $this->actingAs($member)->getJson('/api/v1/member/invitations')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $own->id)
            ->assertJsonPath('data.0.can_respond', true)
            ->assertJsonMissingPath('data.0.token_hash')
            ->assertJsonMissingPath('data.0.public_token')
            ->assertJsonMissingPath('data.0.profile');
    }

    public function test_member_can_accept_or_decline_their_active_invitation(): void
    {
        $admin = User::factory()->admin()->create();
        $member = User::factory()->create();
        $profile = Profile::factory()->create(['user_id' => $member->id]);
        $event = Event::factory()->create([
            'created_by' => $admin->id,
            'starts_at' => now()->addWeek(),
            'status' => EventStatus::Upcoming,
        ]);
        $invitation = $this->invitation($event, $profile, $admin, ['sent_at' => now()]);

        $this->actingAs($member)->postJson("/api/v1/member/invitations/{$invitation->id}/response", [
            'response' => InvitationStatus::Accepted->value,
        ])->assertOk()
            ->assertJsonPath('data.status', InvitationStatus::Accepted->value)
            ->assertJsonPath('data.future_interest', null);

        $this->postJson("/api/v1/member/invitations/{$invitation->id}/response", [
            'response' => InvitationStatus::Declined->value,
            'future_interest' => true,
        ])->assertOk()
            ->assertJsonPath('data.status', InvitationStatus::Declined->value)
            ->assertJsonPath('data.future_interest', true);
    }

    public function test_member_cannot_respond_to_another_unsent_or_past_invitation(): void
    {
        $admin = User::factory()->admin()->create();
        $member = User::factory()->create();
        $profile = Profile::factory()->create(['user_id' => $member->id]);
        $otherProfile = Profile::factory()->create();
        $future = Event::factory()->create([
            'created_by' => $admin->id,
            'starts_at' => now()->addWeek(),
            'status' => EventStatus::Upcoming,
        ]);
        $past = Event::factory()->create([
            'created_by' => $admin->id,
            'starts_at' => now()->subWeek(),
            'status' => EventStatus::Completed,
        ]);
        $other = $this->invitation($future, $otherProfile, $admin, ['sent_at' => now()]);
        $unsent = $this->invitation($future, $profile, $admin);
        $pastInvitation = $this->invitation($past, $profile, $admin, ['sent_at' => now()]);

        foreach ([$other, $unsent, $pastInvitation] as $invitation) {
            $this->actingAs($member)->postJson("/api/v1/member/invitations/{$invitation->id}/response", [
                'response' => InvitationStatus::Accepted->value,
            ])->assertNotFound();
        }
    }

    private function invitation(Event $event, Profile $profile, User $admin, array $attributes = []): Invitation
    {
        $selection = EventSelection::factory()->create([
            'event_id' => $event->id,
            'profile_id' => $profile->id,
            'selected_by' => $admin->id,
        ]);

        return Invitation::factory()->for($selection, 'selection')->create($attributes);
    }
}
