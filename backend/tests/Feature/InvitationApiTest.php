<?php

namespace Tests\Feature;

use App\Enums\EventStatus;
use App\Enums\InvitationStatus;
use App\Models\Event;
use App\Models\EventSelection;
use App\Models\Invitation;
use App\Models\Profile;
use App\Models\User;
use App\Support\InvitationToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvitationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_invitation_routes_require_an_admin(): void
    {
        [, $event, $selection] = $this->context();
        $invitation = Invitation::factory()->for($selection, 'selection')->create(['token_expires_at' => $event->starts_at]);

        $this->getJson("/api/v1/admin/events/{$event->id}/invitations")->assertUnauthorized();
        $this->actingAs(User::factory()->create());
        $this->getJson("/api/v1/admin/events/{$event->id}/invitations")->assertForbidden();
        $this->postJson("/api/v1/admin/events/{$event->id}/invitations", ['selection_id' => $selection->id])->assertForbidden();
        $this->getJson("/api/v1/admin/invitations/{$invitation->id}")->assertForbidden();
        $this->postJson("/api/v1/admin/invitations/{$invitation->id}/mark-sent")->assertForbidden();
        $this->postJson("/api/v1/admin/invitations/{$invitation->id}/cancel")->assertForbidden();
    }

    public function test_admin_creates_an_invitation_once_and_receives_the_token_only_once(): void
    {
        [$admin, $event, $selection] = $this->context();
        $this->actingAs($admin);
        config(['dinee.frontend_url' => 'https://app.ledinee.test']);

        $created = $this->postJson("/api/v1/admin/events/{$event->id}/invitations", ['selection_id' => $selection->id])
            ->assertCreated()->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.selection.id', $selection->id)->assertJsonMissingPath('data.token_hash');
        $plainTextToken = $created->json('data.public_token');
        $this->assertIsString($plainTextToken);
        $this->assertMatchesRegularExpression('/^[A-Za-z0-9_-]{43}$/', $plainTextToken);
        $this->assertSame("https://app.ledinee.test/invitation/{$plainTextToken}", $created->json('data.public_url'));
        $this->assertStringStartsWith('https://wa.me/243810000001?text=', $created->json('data.whatsapp_url'));
        $this->assertStringContainsString('Bonjour Patrick,', $created->json('data.whatsapp_message'));
        $this->assertStringContainsString($event->title, $created->json('data.whatsapp_message'));
        $this->assertStringContainsString($created->json('data.public_url'), $created->json('data.whatsapp_message'));
        $invitation = Invitation::sole();
        $this->assertSame(InvitationToken::hash($plainTextToken), $invitation->getRawOriginal('token_hash'));
        $this->assertTrue($invitation->token_expires_at->equalTo($event->starts_at));

        $this->postJson("/api/v1/admin/events/{$event->id}/invitations", ['selection_id' => $selection->id])
            ->assertOk()->assertJsonPath('data.id', $invitation->id)
            ->assertJsonMissingPath('data.public_token')->assertJsonMissingPath('data.token_hash');
        $this->assertDatabaseCount('invitations', 1);
    }

    public function test_creation_requires_matching_active_selection_and_upcoming_event(): void
    {
        [$admin, $event, $selection] = $this->context();
        $otherSelection = EventSelection::factory()->create();
        $this->actingAs($admin);

        $this->postJson("/api/v1/admin/events/{$event->id}/invitations", ['selection_id' => $otherSelection->id])
            ->assertUnprocessable()->assertJsonValidationErrors('selection_id');
        $selection->forceFill(['withdrawn_at' => now()])->save();
        $this->postJson("/api/v1/admin/events/{$event->id}/invitations", ['selection_id' => $selection->id])
            ->assertUnprocessable()->assertJsonValidationErrors('selection_id');
        $selection->forceFill(['withdrawn_at' => null])->save();
        $event->forceFill(['status' => EventStatus::Draft])->save();
        $this->postJson("/api/v1/admin/events/{$event->id}/invitations", ['selection_id' => $selection->id])
            ->assertUnprocessable()->assertJsonValidationErrors('event');
        $this->assertDatabaseCount('invitations', 0);
    }

    public function test_mark_sent_and_cancel_are_idempotent_controlled_transitions(): void
    {
        [$admin, $event, $selection] = $this->context();
        $invitation = Invitation::factory()->for($selection, 'selection')->create(['token_expires_at' => $event->starts_at]);
        $this->actingAs($admin);

        $sentAt = $this->postJson("/api/v1/admin/invitations/{$invitation->id}/mark-sent")
            ->assertOk()->assertJsonPath('data.status', 'pending')->json('data.sent_at');
        $this->assertNotNull($sentAt);
        $this->postJson("/api/v1/admin/invitations/{$invitation->id}/mark-sent")
            ->assertOk()->assertJsonPath('data.sent_at', $sentAt);

        $revokedAt = $this->postJson("/api/v1/admin/invitations/{$invitation->id}/cancel")
            ->assertOk()->assertJsonPath('data.status', 'cancelled')->json('data.token_revoked_at');
        $this->assertNotNull($revokedAt);
        $this->postJson("/api/v1/admin/invitations/{$invitation->id}/cancel")
            ->assertOk()->assertJsonPath('data.token_revoked_at', $revokedAt);
        $this->postJson("/api/v1/admin/invitations/{$invitation->id}/mark-sent")
            ->assertUnprocessable()->assertJsonValidationErrors('status');
    }

    public function test_admin_lists_filters_and_views_without_token_hashes(): void
    {
        [$admin, $event, $selection] = $this->context();
        Invitation::factory()->for($selection, 'selection')->create(['token_expires_at' => $event->starts_at]);
        $acceptedSelection = EventSelection::factory()->for($event)->create();
        $accepted = Invitation::factory()->sent()->for($acceptedSelection, 'selection')->create([
            'status' => InvitationStatus::Accepted,
            'responded_at' => now(),
            'token_expires_at' => $event->starts_at,
        ]);
        $this->actingAs($admin);

        $this->getJson("/api/v1/admin/events/{$event->id}/invitations?status=accepted&sent=1")
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $accepted->id)
            ->assertJsonPath('meta.total', 1)->assertJsonMissingPath('data.0.token_hash');
        $this->getJson("/api/v1/admin/invitations/{$accepted->id}")
            ->assertOk()->assertJsonPath('data.id', $accepted->id)->assertJsonMissingPath('data.token_hash');
    }

    private function context(): array
    {
        $admin = User::factory()->admin()->create();
        $event = Event::factory()->create([
            'created_by' => $admin->id,
            'status' => EventStatus::Upcoming,
            'starts_at' => now()->addMonth(),
        ]);
        $profile = Profile::factory()->create(['first_name' => 'Patrick', 'phone' => '+243810000001']);
        $selection = EventSelection::factory()->for($event)->for($profile)->create(['selected_by' => $admin->id]);

        return [$admin, $event, $selection];
    }
}
