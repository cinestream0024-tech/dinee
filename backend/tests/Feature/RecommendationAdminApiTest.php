<?php

namespace Tests\Feature;

use App\Enums\ProfileSource;
use App\Enums\RecommendationStatus;
use App\Models\Profile;
use App\Models\Recommendation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecommendationAdminApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_admin_can_list_and_review_recommendations(): void
    {
        $recommendation = Recommendation::factory()->create();

        $this->getJson('/api/v1/admin/recommendations')->assertUnauthorized();
        $this->actingAs(User::factory()->create())
            ->getJson('/api/v1/admin/recommendations')->assertForbidden();
        $this->postJson("/api/v1/admin/recommendations/{$recommendation->id}/reject")
            ->assertForbidden();
    }

    public function test_admin_lists_filters_and_sees_potential_duplicate_profiles(): void
    {
        $existing = Profile::factory()->create(['email' => 'sarah@example.test']);
        Recommendation::factory()->create([
            'name' => 'Sarah Kabeya',
            'email' => 'sarah@example.test',
            'status' => RecommendationStatus::Pending,
        ]);
        Recommendation::factory()->create([
            'name' => 'Autre personne',
            'status' => RecommendationStatus::Rejected,
        ]);

        $this->actingAs(User::factory()->admin()->create())
            ->getJson('/api/v1/admin/recommendations?status=pending&q=Sarah')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Sarah Kabeya')
            ->assertJsonPath('data.0.potential_duplicates.0.id', $existing->id);
    }

    public function test_admin_accepts_recommendation_and_creates_profile_without_account(): void
    {
        $admin = User::factory()->admin()->create();
        $recommendation = Recommendation::factory()->create([
            'name' => 'Sarah Kabeya',
            'email' => 'sarah@example.test',
            'phone' => '+243810000555',
            'company' => 'Atlas Capital',
            'job_title' => 'Investment Manager',
        ]);

        $this->actingAs($admin)->postJson(
            "/api/v1/admin/recommendations/{$recommendation->id}/accept",
            ['first_name' => 'Sarah', 'last_name' => 'Kabeya'],
        )->assertOk()
            ->assertJsonPath('data.status', RecommendationStatus::Accepted->value)
            ->assertJsonPath('data.recommended_profile.name', 'Sarah Kabeya');

        $profile = Profile::where('email', 'sarah@example.test')->sole();
        $this->assertNull($profile->user_id);
        $this->assertSame(ProfileSource::Recommendation, $profile->source);
        $this->assertSame($admin->id, $profile->created_by);
        $this->assertSame($profile->id, $recommendation->fresh()->recommended_profile_id);
    }

    public function test_admin_can_link_duplicate_profile_instead_of_creating_another(): void
    {
        $existing = Profile::factory()->create(['email' => 'sarah@example.test']);
        $recommendation = Recommendation::factory()->create(['email' => 'sarah@example.test']);

        $this->actingAs(User::factory()->admin()->create())
            ->postJson("/api/v1/admin/recommendations/{$recommendation->id}/accept", [
                'existing_profile_id' => $existing->id,
            ])->assertOk()
            ->assertJsonPath('data.recommended_profile.id', $existing->id);

        $this->assertDatabaseCount('profiles', 2);
    }

    public function test_admin_rejects_once_and_reviewed_recommendation_cannot_transition_again(): void
    {
        $admin = User::factory()->admin()->create();
        $recommendation = Recommendation::factory()->create();

        $this->actingAs($admin)
            ->postJson("/api/v1/admin/recommendations/{$recommendation->id}/reject")
            ->assertOk()
            ->assertJsonPath('data.status', RecommendationStatus::Rejected->value);

        $recommendation->refresh();
        $this->assertSame($admin->id, $recommendation->reviewed_by);
        $this->assertNotNull($recommendation->reviewed_at);

        $this->postJson("/api/v1/admin/recommendations/{$recommendation->id}/accept", [
            'first_name' => 'Sarah', 'last_name' => 'Kabeya',
        ])->assertUnprocessable()->assertJsonValidationErrors('status');
    }
}
