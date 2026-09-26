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

class SelectionApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_selection_and_history_routes_require_an_admin(): void
    {
        $admin = User::factory()->admin()->create();
        $event = $this->futureEvent($admin);
        $profile = Profile::factory()->create();

        $this->getJson("/api/v1/admin/events/{$event->id}/selections")->assertUnauthorized();
        $this->getJson("/api/v1/admin/profiles/{$profile->id}/history")->assertUnauthorized();

        $this->actingAs(User::factory()->create());
        $this->getJson("/api/v1/admin/events/{$event->id}/selections")->assertForbidden();
        $this->postJson("/api/v1/admin/events/{$event->id}/selections", ['profile_id' => $profile->id])->assertForbidden();
        $this->deleteJson("/api/v1/admin/events/{$event->id}/selections/{$profile->id}")->assertForbidden();
        $this->getJson("/api/v1/admin/profiles/{$profile->id}/history")->assertForbidden();
    }

    public function test_admin_selects_a_profile_and_repeating_the_request_is_idempotent(): void
    {
        $admin = User::factory()->admin()->create();
        $event = $this->futureEvent($admin);
        $profile = Profile::factory()->create();
        $this->actingAs($admin);

        $created = $this->postJson("/api/v1/admin/events/{$event->id}/selections", [
            'profile_id' => $profile->id,
        ])->assertCreated()
            ->assertJsonPath('data.profile.id', $profile->id);

        $selectionId = $created->json('data.id');
        $selectedAt = $created->json('data.selected_at');

        $this->postJson("/api/v1/admin/events/{$event->id}/selections", [
            'profile_id' => $profile->id,
        ])->assertOk()
            ->assertJsonPath('data.id', $selectionId)
            ->assertJsonPath('data.selected_at', $selectedAt);

        $this->assertDatabaseCount('event_selections', 1);
        $selection = EventSelection::sole();
        $this->assertSame($admin->id, $selection->selected_by);
        $this->assertNull($selection->withdrawn_at);
    }

    public function test_admin_lists_active_selections_withdraws_and_can_reactivate_one(): void
    {
        $admin = User::factory()->admin()->create();
        $event = $this->futureEvent($admin);
        $patrick = Profile::factory()->create(['first_name' => 'Patrick']);
        $sarah = Profile::factory()->create(['first_name' => 'Sarah']);
        $this->actingAs($admin);

        $patrickSelection = $this->postJson("/api/v1/admin/events/{$event->id}/selections", [
            'profile_id' => $patrick->id,
        ])->assertCreated()->json('data.id');
        $this->postJson("/api/v1/admin/events/{$event->id}/selections", [
            'profile_id' => $sarah->id,
        ])->assertCreated();

        $this->deleteJson("/api/v1/admin/events/{$event->id}/selections/{$patrick->id}")
            ->assertNoContent();

        $this->getJson("/api/v1/admin/events/{$event->id}/selections?per_page=1")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.profile.id', $sarah->id)
            ->assertJsonPath('meta.total', 1);
        $this->assertNotNull(EventSelection::findOrFail($patrickSelection)->withdrawn_at);

        $this->postJson("/api/v1/admin/events/{$event->id}/selections", [
            'profile_id' => $patrick->id,
        ])->assertOk()->assertJsonPath('data.id', $patrickSelection);

        $this->assertDatabaseCount('event_selections', 2);
        $this->assertNull(EventSelection::findOrFail($patrickSelection)->withdrawn_at);
    }

    public function test_selection_with_an_invitation_cannot_be_withdrawn(): void
    {
        $admin = User::factory()->admin()->create();
        $event = $this->futureEvent($admin);
        $profile = Profile::factory()->create();
        $this->actingAs($admin)
            ->postJson("/api/v1/admin/events/{$event->id}/selections", ['profile_id' => $profile->id])
            ->assertCreated();
        $selection = EventSelection::sole();

        Invitation::query()->forceCreate([
            'event_selection_id' => $selection->id,
            'status' => InvitationStatus::Pending,
            'token_hash' => str_repeat('a', 64),
            'token_expires_at' => now()->addDay(),
        ]);

        $this->deleteJson("/api/v1/admin/events/{$event->id}/selections/{$profile->id}")
            ->assertStatus(409);

        $this->assertNull($selection->fresh()->withdrawn_at);
    }

    public function test_selection_requires_an_existing_profile_and_a_future_selectable_event(): void
    {
        $admin = User::factory()->admin()->create();
        $profile = Profile::factory()->create();
        $unscheduled = Event::factory()->create([
            'created_by' => $admin->id,
            'starts_at' => null,
            'status' => EventStatus::Draft,
        ]);
        $completed = Event::factory()->create([
            'created_by' => $admin->id,
            'starts_at' => now()->addMonth(),
            'status' => EventStatus::Completed,
        ]);
        $this->actingAs($admin);

        $this->postJson("/api/v1/admin/events/{$unscheduled->id}/selections", ['profile_id' => $profile->id])
            ->assertUnprocessable()->assertJsonValidationErrors('event');
        $this->postJson("/api/v1/admin/events/{$completed->id}/selections", ['profile_id' => $profile->id])
            ->assertUnprocessable()->assertJsonValidationErrors('event');
        $this->postJson("/api/v1/admin/events/{$this->futureEvent($admin)->id}/selections", ['profile_id' => 999999])
            ->assertUnprocessable()->assertJsonValidationErrors('profile_id');

        $this->assertDatabaseCount('event_selections', 0);
    }

    public function test_profile_history_contains_active_and_withdrawn_selections_in_event_order(): void
    {
        $admin = User::factory()->admin()->create();
        $profile = Profile::factory()->create();
        $older = Event::factory()->create([
            'title' => 'DINEE Ancien',
            'created_by' => $admin->id,
            'starts_at' => '2098-01-15 18:00:00',
            'status' => EventStatus::Draft,
        ]);
        $newer = Event::factory()->create([
            'title' => 'DINEE Récent',
            'created_by' => $admin->id,
            'starts_at' => '2099-01-15 18:00:00',
            'status' => EventStatus::Upcoming,
        ]);
        $this->actingAs($admin);

        $this->postJson("/api/v1/admin/events/{$older->id}/selections", ['profile_id' => $profile->id])->assertCreated();
        $this->postJson("/api/v1/admin/events/{$newer->id}/selections", ['profile_id' => $profile->id])->assertCreated();
        $this->deleteJson("/api/v1/admin/events/{$older->id}/selections/{$profile->id}")->assertNoContent();

        $this->getJson("/api/v1/admin/profiles/{$profile->id}/history")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.event_id', $newer->id)
            ->assertJsonPath('data.0.event_title', 'DINEE Récent')
            ->assertJsonPath('data.0.status', 'selected')
            ->assertJsonPath('data.1.event_id', $older->id)
            ->assertJsonPath('data.1.event_title', 'DINEE Ancien')
            ->assertJsonPath('data.1.status', 'withdrawn');
    }

    private function futureEvent(User $admin): Event
    {
        return Event::factory()->create([
            'created_by' => $admin->id,
            'starts_at' => now()->addMonth(),
            'status' => EventStatus::Draft,
        ]);
    }
}
