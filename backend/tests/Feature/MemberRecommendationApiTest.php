<?php

namespace Tests\Feature;

use App\Enums\RecommendationStatus;
use App\Models\Profile;
use App\Models\Recommendation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemberRecommendationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_recommendation_routes_require_an_authenticated_member(): void
    {
        $this->getJson('/api/v1/member/recommendations')->assertUnauthorized();
        $this->postJson('/api/v1/member/recommendations', $this->payload())->assertUnauthorized();

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)->getJson('/api/v1/member/recommendations')->assertForbidden();
        $this->postJson('/api/v1/member/recommendations', $this->payload())->assertForbidden();
    }

    public function test_member_submits_a_normalized_pending_recommendation_for_their_profile(): void
    {
        $member = User::factory()->create();
        $profile = Profile::factory()->create(['user_id' => $member->id]);

        $this->actingAs($member)->postJson('/api/v1/member/recommendations', $this->payload([
            'email' => ' SARAH@example.test ',
            'phone' => '+243 (810) 000-555',
            'linkedin_url' => 'http://linkedin.com/in/sarah-kabeya/?trk=profile',
            'recommender_profile_id' => Profile::factory()->create()->id,
            'status' => RecommendationStatus::Accepted->value,
        ]))->assertUnprocessable()
            ->assertJsonValidationErrors(['recommender_profile_id', 'status']);

        $response = $this->postJson('/api/v1/member/recommendations', $this->payload([
            'email' => ' SARAH@example.test ',
            'phone' => '+243 (810) 000-555',
            'linkedin_url' => 'http://linkedin.com/in/sarah-kabeya/?trk=profile',
        ]));

        $response->assertCreated()
            ->assertJsonPath('data.status', RecommendationStatus::Pending->value)
            ->assertJsonPath('data.email', 'sarah@example.test')
            ->assertJsonPath('data.phone', '+243810000555')
            ->assertJsonPath('data.linkedin_url', 'https://www.linkedin.com/in/sarah-kabeya')
            ->assertJsonMissingPath('data.recommender_profile_id');

        $recommendation = Recommendation::sole();
        $this->assertSame($profile->id, $recommendation->recommender_profile_id);
        $this->assertSame(RecommendationStatus::Pending, $recommendation->status);
    }

    public function test_member_only_lists_their_own_recommendations(): void
    {
        $member = User::factory()->create();
        $profile = Profile::factory()->create(['user_id' => $member->id]);
        Recommendation::factory()->for($profile, 'recommender')->create(['name' => 'Sarah Kabeya']);
        Recommendation::factory()->create(['name' => 'Personne privée']);

        $this->actingAs($member)->getJson('/api/v1/member/recommendations')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Sarah Kabeya')
            ->assertJsonMissing(['name' => 'Personne privée']);
    }

    public function test_duplicate_pending_contact_from_the_same_member_is_rejected(): void
    {
        $member = User::factory()->create();
        $profile = Profile::factory()->create(['user_id' => $member->id]);
        Recommendation::factory()->for($profile, 'recommender')->create([
            'email' => 'sarah@example.test',
        ]);

        $this->actingAs($member)->postJson('/api/v1/member/recommendations', $this->payload([
            'email' => ' SARAH@example.test ',
        ]))->assertUnprocessable()->assertJsonValidationErrors('contact');

        $this->assertDatabaseCount('recommendations', 1);
    }

    public function test_member_without_a_profile_cannot_submit_a_recommendation(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/member/recommendations', $this->payload())
            ->assertForbidden();
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Sarah Kabeya',
            'job_title' => 'Investment Manager',
            'company' => 'Atlas Capital',
            'email' => 'sarah@example.test',
            'phone' => null,
            'linkedin_url' => null,
            'reason' => 'Son expérience en investissement serait pertinente pour le réseau.',
        ], $overrides);
    }
}
