<?php

namespace Tests\Feature;

use App\Enums\EventStatus;
use App\Models\Event;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_event_routes_require_an_admin(): void
    {
        $event = Event::factory()->create();

        $this->getJson('/api/v1/admin/events')->assertUnauthorized();

        $this->actingAs(User::factory()->create());
        $this->getJson('/api/v1/admin/events')->assertForbidden();
        $this->postJson('/api/v1/admin/events', $this->eventData())->assertForbidden();
        $this->getJson("/api/v1/admin/events/{$event->id}")->assertForbidden();
        $this->patchJson("/api/v1/admin/events/{$event->id}", $this->eventData())->assertForbidden();
    }

    public function test_admin_creates_an_upcoming_event_from_local_time(): void
    {
        $admin = User::factory()->admin()->create();
        $payload = $this->eventData(['status' => 'upcoming']);
        $expectedUtc = CarbonImmutable::createFromFormat(
            'Y-m-d\TH:i',
            $payload['starts_at_local'],
            $payload['timezone']
        )->startOfMinute()->utc();

        $this->actingAs($admin)->postJson('/api/v1/admin/events', $payload)
            ->assertCreated()
            ->assertJsonPath('data.title', 'DINEE du 18 octobre')
            ->assertJsonPath('data.starts_at', $expectedUtc->toISOString())
            ->assertJsonPath('data.starts_at_local', $payload['starts_at_local'])
            ->assertJsonPath('data.timezone', 'Africa/Kinshasa')
            ->assertJsonPath('data.status', 'upcoming')
            ->assertJsonPath('data.capacity', 30)
            ->assertJsonPath('data.selected_count', 0)
            ->assertJsonPath('data.over_capacity', false);

        $event = Event::sole();
        $this->assertSame($admin->id, $event->created_by);
        $this->assertTrue($expectedUtc->equalTo($event->starts_at));
    }

    public function test_event_schedule_timezone_and_capacity_are_validated(): void
    {
        $this->actingAs(User::factory()->admin()->create());

        $this->postJson('/api/v1/admin/events', $this->eventData([
            'status' => 'upcoming',
            'starts_at_local' => '2020-01-01T19:00',
        ]))->assertUnprocessable()
            ->assertJsonValidationErrors('starts_at_local')
            ->assertJsonMissingValidationErrors('location');

        $this->postJson('/api/v1/admin/events', $this->eventData([
            'status' => 'upcoming',
            'location' => null,
        ]))->assertUnprocessable()
            ->assertJsonValidationErrors('location')
            ->assertJsonMissingValidationErrors('starts_at_local');

        $this->postJson('/api/v1/admin/events', $this->eventData([
            'starts_at_local' => '18/10/2099 19:00',
            'timezone' => 'Not/A-Timezone',
            'capacity' => 0,
        ]))->assertUnprocessable()
            ->assertJsonValidationErrors(['starts_at_local', 'timezone', 'capacity']);

        $this->assertDatabaseCount('events', 0);
    }

    public function test_admin_can_publish_or_cancel_a_draft_but_cannot_revert_an_upcoming_event(): void
    {
        $admin = User::factory()->admin()->create();
        $draft = Event::factory()->create(['created_by' => $admin->id, 'status' => EventStatus::Draft]);
        $this->actingAs($admin);

        $this->patchJson("/api/v1/admin/events/{$draft->id}", $this->eventData(['status' => 'upcoming']))
            ->assertOk()->assertJsonPath('data.status', 'upcoming');

        $this->patchJson("/api/v1/admin/events/{$draft->id}", $this->eventData(['status' => 'draft']))
            ->assertUnprocessable()->assertJsonValidationErrors('status');

        $this->patchJson("/api/v1/admin/events/{$draft->id}", $this->eventData(['status' => 'completed']))
            ->assertUnprocessable()->assertJsonValidationErrors('status');

        $cancellable = Event::factory()->create(['created_by' => $admin->id, 'status' => EventStatus::Draft]);
        $this->patchJson("/api/v1/admin/events/{$cancellable->id}", $this->eventData(['status' => 'cancelled']))
            ->assertOk()->assertJsonPath('data.status', 'cancelled');
    }

    public function test_started_upcoming_event_can_be_completed_and_its_date_is_preserved(): void
    {
        $admin = User::factory()->admin()->create();
        $originalStart = CarbonImmutable::parse('2020-10-18 18:00:00', 'UTC');
        $event = Event::factory()->create([
            'created_by' => $admin->id,
            'starts_at' => $originalStart,
            'status' => EventStatus::Upcoming,
        ]);

        $this->actingAs($admin)->patchJson(
            "/api/v1/admin/events/{$event->id}",
            $this->eventData(['status' => 'completed'])
        )->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.starts_at', $originalStart->toISOString());

        $this->patchJson("/api/v1/admin/events/{$event->id}", $this->eventData(['status' => 'completed']))
            ->assertUnprocessable()->assertJsonValidationErrors('status');
    }

    public function test_admin_can_list_search_and_separate_future_past_and_unscheduled_events(): void
    {
        $admin = User::factory()->admin()->create();
        $futureSoon = Event::factory()->create([
            'title' => 'DINEE Finance',
            'starts_at' => '2099-01-15 18:00:00',
            'status' => EventStatus::Upcoming,
            'created_by' => $admin->id,
        ]);
        $futureLate = Event::factory()->create([
            'title' => 'DINEE Immobilier',
            'starts_at' => '2099-12-15 18:00:00',
            'status' => EventStatus::Upcoming,
            'created_by' => $admin->id,
        ]);
        $past = Event::factory()->create([
            'title' => 'DINEE Historique',
            'starts_at' => '2020-01-15 18:00:00',
            'status' => EventStatus::Completed,
            'created_by' => $admin->id,
        ]);
        $unscheduled = Event::factory()->create([
            'title' => 'DINEE à planifier',
            'starts_at' => null,
            'status' => EventStatus::Draft,
            'created_by' => $admin->id,
        ]);
        $this->actingAs($admin);

        $this->getJson('/api/v1/admin/events?period=future&status=upcoming&per_page=10')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $futureSoon->id)
            ->assertJsonPath('data.1.id', $futureLate->id);

        $this->getJson('/api/v1/admin/events?period=past&q=Historique')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $past->id);

        $this->getJson('/api/v1/admin/events?period=unscheduled')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $unscheduled->id);
    }

    public function test_created_by_cannot_be_supplied_by_the_client(): void
    {
        $admin = User::factory()->admin()->create();
        $otherAdmin = User::factory()->admin()->create();

        $this->actingAs($admin)->postJson('/api/v1/admin/events', $this->eventData([
            'created_by' => $otherAdmin->id,
        ]))->assertUnprocessable()->assertJsonValidationErrors('created_by');

        $this->assertDatabaseCount('events', 0);
    }

    private function eventData(array $overrides = []): array
    {
        return array_merge([
            'title' => 'DINEE du 18 octobre',
            'starts_at_local' => '2099-10-18T19:00',
            'timezone' => 'Africa/Kinshasa',
            'location' => 'Lieu fictif — Kinshasa',
            'description' => 'Une édition privée de démonstration.',
            'capacity' => 30,
            'status' => 'draft',
        ], $overrides);
    }
}
