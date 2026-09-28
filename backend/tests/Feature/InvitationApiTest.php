<?php

namespace Tests\Feature;

use App\Enums\EventStatus;
use App\Enums\InvitationStatus;
use App\Models\Event;
use App\Models\EventSelection;
use App\Models\Invitation;
use App\Models\InvitationFollowUp;
use App\Models\Profile;
use App\Models\User;
use App\Support\InvitationToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
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
        $this->postJson("/api/v1/admin/invitations/{$invitation->id}/rotate-token")->assertForbidden();
        $this->postJson("/api/v1/admin/invitations/{$invitation->id}/revoke-token")->assertForbidden();
        $this->postJson("/api/v1/admin/invitations/{$invitation->id}/follow-ups", ['operation_id' => Str::uuid()])->assertForbidden();
        $this->postJson("/api/v1/admin/invitations/{$invitation->id}/cancel")->assertForbidden();
        $this->assertNull($invitation->fresh()->token_revoked_at);
        $this->assertDatabaseCount('invitation_follow_ups', 0);
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

    public function test_admin_rotates_a_token_and_the_old_public_link_stops_working(): void
    {
        [$admin, $event, $selection] = $this->context();
        $oldToken = InvitationToken::issue();
        $sentAt = now()->subHour()->startOfSecond();
        $invitation = Invitation::factory()->for($selection, 'selection')->create([
            'token_hash' => $oldToken['hash'],
            'token_expires_at' => $event->starts_at,
            'sent_at' => $sentAt,
        ]);
        $this->actingAs($admin);
        config(['dinee.frontend_url' => 'https://app.ledinee.test']);

        $this->getJson("/api/v1/public/invitations/{$oldToken['plain_text']}")->assertOk();
        $response = $this->postJson("/api/v1/admin/invitations/{$invitation->id}/rotate-token")
            ->assertOk()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.sent_at', $sentAt->toISOString())
            ->assertJsonMissingPath('data.token_hash');

        $newToken = $response->json('data.public_token');
        $this->assertNotSame($oldToken['plain_text'], $newToken);
        $this->assertSame("https://app.ledinee.test/invitation/{$newToken}", $response->json('data.public_url'));
        $this->assertSame(InvitationToken::hash($newToken), $invitation->fresh()->getRawOriginal('token_hash'));
        $this->assertNull($invitation->fresh()->token_revoked_at);
        $this->getJson("/api/v1/public/invitations/{$oldToken['plain_text']}")->assertNotFound();
        $this->getJson("/api/v1/public/invitations/{$newToken}")->assertOk();
    }

    public function test_admin_revokes_a_token_idempotently_without_cancelling_the_invitation(): void
    {
        [$admin, $event, $selection] = $this->context();
        $token = InvitationToken::issue();
        $invitation = Invitation::factory()->for($selection, 'selection')->create([
            'token_hash' => $token['hash'],
            'token_expires_at' => $event->starts_at,
        ]);
        $this->actingAs($admin);

        $revokedAt = $this->postJson("/api/v1/admin/invitations/{$invitation->id}/revoke-token")
            ->assertOk()
            ->assertJsonPath('data.status', 'pending')
            ->json('data.token_revoked_at');
        $this->assertNotNull($revokedAt);
        $this->getJson("/api/v1/public/invitations/{$token['plain_text']}")->assertNotFound();
        $this->postJson("/api/v1/admin/invitations/{$invitation->id}/revoke-token")
            ->assertOk()
            ->assertJsonPath('data.token_revoked_at', $revokedAt);
        $this->assertSame($token['hash'], $invitation->fresh()->getRawOriginal('token_hash'));
    }

    public function test_cancelled_invitation_cannot_receive_a_new_token(): void
    {
        [$admin, $event, $selection] = $this->context();
        $invitation = Invitation::factory()->for($selection, 'selection')->create([
            'status' => InvitationStatus::Cancelled,
            'token_expires_at' => $event->starts_at,
            'token_revoked_at' => now(),
        ]);
        $originalHash = $invitation->getRawOriginal('token_hash');
        $this->actingAs($admin);

        $this->postJson("/api/v1/admin/invitations/{$invitation->id}/rotate-token")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');
        $this->assertSame($originalHash, $invitation->fresh()->getRawOriginal('token_hash'));
    }

    public function test_admin_records_a_due_follow_up_idempotently_with_server_time(): void
    {
        $this->travelTo(now()->startOfSecond());
        config(['dinee.follow_up_delay_hours' => 48]);
        [$admin, $event, $selection] = $this->context();
        $invitation = Invitation::factory()->for($selection, 'selection')->create([
            'sent_at' => now()->subHours(49),
            'token_expires_at' => $event->starts_at,
        ]);
        $otherInvitation = Invitation::factory()->for(EventSelection::factory()->for($event)->for(Profile::factory()), 'selection')->create([
            'sent_at' => now()->subHours(49),
            'token_expires_at' => $event->starts_at,
        ]);
        $operationId = Str::uuid()->toString();
        $this->actingAs($admin);

        $response = $this->postJson("/api/v1/admin/invitations/{$invitation->id}/follow-ups", [
            'operation_id' => $operationId,
        ])->assertOk()
            ->assertJsonPath('data.follow_up_count', 1)
            ->assertJsonPath('data.last_follow_up_at', now()->toISOString())
            ->assertJsonPath('data.is_follow_up_due', false);
        $lastFollowUpAt = $response->json('data.last_follow_up_at');

        $this->postJson("/api/v1/admin/invitations/{$invitation->id}/follow-ups", [
            'operation_id' => $operationId,
        ])->assertOk()
            ->assertJsonPath('data.follow_up_count', 1)
            ->assertJsonPath('data.last_follow_up_at', $lastFollowUpAt);
        $this->assertDatabaseCount('invitation_follow_ups', 1);
        $this->assertDatabaseHas('invitation_follow_ups', [
            'invitation_id' => $invitation->id,
            'recorded_by' => $admin->id,
            'operation_id' => $operationId,
        ]);

        $this->postJson("/api/v1/admin/invitations/{$otherInvitation->id}/follow-ups", [
            'operation_id' => $operationId,
        ])->assertUnprocessable()->assertJsonValidationErrors('operation_id');
        $this->assertDatabaseCount('invitation_follow_ups', 1);
    }

    public function test_follow_up_rejects_an_unsent_or_not_yet_due_invitation(): void
    {
        $this->travelTo(now()->startOfSecond());
        config(['dinee.follow_up_delay_hours' => 48]);
        [$admin, $event, $selection] = $this->context();
        $unsent = Invitation::factory()->for($selection, 'selection')->create([
            'sent_at' => null,
            'token_expires_at' => $event->starts_at,
        ]);
        $recent = Invitation::factory()->for(EventSelection::factory()->for($event)->for(Profile::factory()), 'selection')->create([
            'sent_at' => now()->subHours(47),
            'token_expires_at' => $event->starts_at,
        ]);
        $this->actingAs($admin);

        $this->postJson("/api/v1/admin/invitations/{$unsent->id}/follow-ups", [
            'operation_id' => Str::uuid(),
        ])->assertUnprocessable()->assertJsonValidationErrors('invitation');
        $this->postJson("/api/v1/admin/invitations/{$recent->id}/follow-ups", [
            'operation_id' => Str::uuid(),
        ])->assertUnprocessable()->assertJsonValidationErrors('invitation');
        $this->assertDatabaseCount('invitation_follow_ups', 0);
    }

    public function test_follow_up_due_filter_uses_the_configured_delay_and_latest_contact(): void
    {
        $this->travelTo(now()->startOfSecond());
        config(['dinee.follow_up_delay_hours' => 48]);
        [$admin, $event, $selection] = $this->context();
        $this->actingAs($admin);

        $due = Invitation::factory()->for($selection, 'selection')->create([
            'sent_at' => now()->subHours(49),
            'token_expires_at' => $event->starts_at,
        ]);
        $recent = Invitation::factory()->for(EventSelection::factory()->for($event)->for(Profile::factory()), 'selection')->create([
            'sent_at' => now()->subHours(47),
            'token_expires_at' => $event->starts_at,
        ]);
        $followedUp = Invitation::factory()->for(EventSelection::factory()->for($event)->for(Profile::factory()), 'selection')->create([
            'sent_at' => now()->subHours(72),
            'token_expires_at' => $event->starts_at,
        ]);
        InvitationFollowUp::query()->forceCreate([
            'invitation_id' => $followedUp->id,
            'recorded_by' => $admin->id,
            'sent_at' => now()->subHours(2),
            'operation_id' => Str::uuid(),
        ]);
        $revoked = Invitation::factory()->for(EventSelection::factory()->for($event)->for(Profile::factory()), 'selection')->create([
            'sent_at' => now()->subHours(49),
            'token_expires_at' => $event->starts_at,
            'token_revoked_at' => now()->subHour(),
        ]);
        Invitation::factory()->for(EventSelection::factory()->for($event)->for(Profile::factory()), 'selection')->create([
            'status' => InvitationStatus::Accepted,
            'sent_at' => now()->subHours(72),
            'responded_at' => now()->subHours(60),
            'token_expires_at' => $event->starts_at,
        ]);

        $response = $this->getJson("/api/v1/admin/events/{$event->id}/invitations?follow_up_due=1")
            ->assertOk()
            ->assertJsonPath('meta.total', 2);
        $this->assertEqualsCanonicalizing([$due->id, $revoked->id], collect($response->json('data'))->pluck('id')->all());
        $response->assertJsonPath('data.0.is_follow_up_due', true)
            ->assertJsonPath('data.1.is_follow_up_due', true);

        $all = $this->getJson("/api/v1/admin/events/{$event->id}/invitations")->assertOk();
        $byId = collect($all->json('data'))->keyBy('id');
        $this->assertFalse($byId[$recent->id]['is_follow_up_due']);
        $this->assertFalse($byId[$followedUp->id]['is_follow_up_due']);
        $this->assertSame(1, $byId[$followedUp->id]['follow_up_count']);
        $this->assertNotNull($byId[$followedUp->id]['last_follow_up_at']);
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
