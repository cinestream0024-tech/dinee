<?php

namespace Tests\Feature;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemberProfileApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_profile_routes_require_an_authenticated_member(): void
    {
        $this->getJson('/api/v1/member/profile')->assertUnauthorized();

        $this->actingAs(User::factory()->admin()->create())
            ->getJson('/api/v1/member/profile')
            ->assertForbidden();
    }

    public function test_member_can_view_only_the_profile_linked_to_their_account(): void
    {
        $member = User::factory()->create();
        $ownProfile = Profile::factory()->create(['user_id' => $member->id, 'first_name' => 'Patrick']);
        Profile::factory()->create(['first_name' => 'Sarah']);

        $this->actingAs($member)->getJson('/api/v1/member/profile')
            ->assertOk()
            ->assertJsonPath('data.id', $ownProfile->id)
            ->assertJsonPath('data.first_name', 'Patrick');
    }

    public function test_member_can_update_their_profile_with_normalized_contacts(): void
    {
        $member = User::factory()->create();
        $profile = Profile::factory()->create(['user_id' => $member->id]);
        $otherProfile = Profile::factory()->create(['company' => 'Autre entreprise']);

        $this->actingAs($member)->patchJson('/api/v1/member/profile', [
            'company' => 'Atlas Capital',
            'email' => ' PATRICK@example.test ',
            'phone' => '+243 (810) 000-099',
            'linkedin_url' => 'http://linkedin.com/in/patrick-membre/?trk=profile',
        ])->assertOk()
            ->assertJsonPath('data.id', $profile->id)
            ->assertJsonPath('data.company', 'Atlas Capital')
            ->assertJsonPath('data.email', 'patrick@example.test')
            ->assertJsonPath('data.phone', '+243810000099')
            ->assertJsonPath('data.linkedin_url', 'https://www.linkedin.com/in/patrick-membre');

        $this->assertSame('Autre entreprise', $otherProfile->fresh()->company);
    }

    public function test_member_cannot_change_profile_ownership_metadata(): void
    {
        $member = User::factory()->create();
        Profile::factory()->create(['user_id' => $member->id]);

        $this->actingAs($member)->patchJson('/api/v1/member/profile', [
            'user_id' => User::factory()->create()->id,
            'source' => 'import',
        ])->assertUnprocessable()->assertJsonValidationErrors(['user_id', 'source']);
    }

    public function test_member_without_a_linked_profile_receives_not_found(): void
    {
        $this->actingAs(User::factory()->create())
            ->getJson('/api/v1/member/profile')
            ->assertNotFound();
    }
}
