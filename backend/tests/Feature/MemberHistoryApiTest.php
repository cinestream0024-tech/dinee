<?php

namespace Tests\Feature;

use App\Enums\AttendanceStatus;
use App\Enums\EventStatus;
use App\Enums\InvitationStatus;
use App\Models\Attendance;
use App\Models\Event;
use App\Models\EventSelection;
use App\Models\Invitation;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemberHistoryApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_history_requires_an_authenticated_member(): void
    {
        $this->getJson('/api/v1/member/history')->assertUnauthorized();

        $this->actingAs(User::factory()->admin()->create())
            ->getJson('/api/v1/member/history')
            ->assertForbidden();
    }

    public function test_member_receives_only_their_history_in_descending_event_order(): void
    {
        $admin = User::factory()->admin()->create();
        $member = User::factory()->create();
        $profile = Profile::factory()->create(['user_id' => $member->id]);
        $otherProfile = Profile::factory()->create();

        $olderEvent = Event::factory()->create([
            'created_by' => $admin->id,
            'title' => 'DINEE Ancien',
            'starts_at' => '2026-01-10 18:00:00',
            'status' => EventStatus::Completed,
        ]);
        $newerEvent = Event::factory()->create([
            'created_by' => $admin->id,
            'title' => 'DINEE Prochain',
            'starts_at' => '2026-12-10 18:00:00',
            'timezone' => 'Africa/Kinshasa',
            'location' => 'Lieu membre',
            'status' => EventStatus::Upcoming,
        ]);
        $otherEvent = Event::factory()->create([
            'created_by' => $admin->id,
            'title' => 'DINEE Privé Sarah',
            'starts_at' => '2026-11-10 18:00:00',
            'status' => EventStatus::Upcoming,
        ]);

        $olderSelection = EventSelection::factory()->create([
            'event_id' => $olderEvent->id,
            'profile_id' => $profile->id,
            'selected_by' => $admin->id,
        ]);
        Invitation::factory()->for($olderSelection, 'selection')->create([
            'status' => InvitationStatus::Accepted,
        ]);
        Attendance::query()->forceCreate([
            'event_selection_id' => $olderSelection->id,
            'status' => AttendanceStatus::Present,
            'recorded_by' => $admin->id,
            'recorded_at' => now(),
        ]);

        $newerSelection = EventSelection::factory()->create([
            'event_id' => $newerEvent->id,
            'profile_id' => $profile->id,
            'selected_by' => $admin->id,
        ]);
        Invitation::factory()->for($newerSelection, 'selection')->create([
            'status' => InvitationStatus::Declined,
        ]);

        EventSelection::factory()->create([
            'event_id' => $otherEvent->id,
            'profile_id' => $otherProfile->id,
            'selected_by' => $admin->id,
        ]);

        $this->actingAs($member)->getJson('/api/v1/member/history')
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.event_id', $newerEvent->id)
            ->assertJsonPath('data.0.event_title', 'DINEE Prochain')
            ->assertJsonPath('data.0.location', 'Lieu membre')
            ->assertJsonPath('data.0.status', 'declined')
            ->assertJsonPath('data.0.invitation_status', 'declined')
            ->assertJsonPath('data.0.attendance_status', null)
            ->assertJsonPath('data.1.event_id', $olderEvent->id)
            ->assertJsonPath('data.1.status', 'present')
            ->assertJsonPath('data.1.invitation_status', 'accepted')
            ->assertJsonPath('data.1.attendance_status', 'present')
            ->assertJsonMissing(['event_title' => 'DINEE Privé Sarah']);
    }

    public function test_member_without_a_linked_profile_receives_not_found(): void
    {
        $this->actingAs(User::factory()->create())
            ->getJson('/api/v1/member/history')
            ->assertNotFound();
    }
}
