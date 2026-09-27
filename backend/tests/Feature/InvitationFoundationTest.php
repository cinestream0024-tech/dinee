<?php

namespace Tests\Feature;

use App\Enums\InvitationStatus;
use App\Models\EventSelection;
use App\Models\Invitation;
use Carbon\CarbonInterface;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class InvitationFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_invitation_factory_builds_a_secure_pending_invitation(): void
    {
        $invitation = Invitation::factory()->create();

        $this->assertSame(InvitationStatus::Pending, $invitation->status);
        $this->assertInstanceOf(EventSelection::class, $invitation->selection);
        $this->assertTrue($invitation->selection->selector->isAdmin());
        $this->assertInstanceOf(CarbonInterface::class, $invitation->token_expires_at);
        $this->assertNull($invitation->future_interest);
        $this->assertArrayNotHasKey('token_hash', $invitation->toArray());
        $this->assertMatchesRegularExpression('/^[a-f0-9]{64}$/', $invitation->getRawOriginal('token_hash'));
        $this->assertTrue(Schema::hasColumns('invitations', [
            'event_selection_id',
            'status',
            'sent_at',
            'responded_at',
            'future_interest',
            'token_hash',
            'token_expires_at',
            'token_revoked_at',
        ]));
    }

    public function test_selection_can_have_only_one_invitation(): void
    {
        $selection = EventSelection::factory()->create();
        Invitation::factory()->for($selection, 'selection')->create();

        $this->expectException(QueryException::class);
        Invitation::factory()->for($selection, 'selection')->create();
    }

    public function test_token_hash_must_be_unique(): void
    {
        $tokenHash = hash('sha256', 'fictitious-test-token');
        Invitation::factory()->create(['token_hash' => $tokenHash]);

        $this->expectException(QueryException::class);
        Invitation::factory()->create(['token_hash' => $tokenHash]);
    }
}
