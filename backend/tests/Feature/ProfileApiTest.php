<?php

namespace Tests\Feature;

use App\Enums\Availability;
use App\Enums\ProfileSource;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_routes_require_an_admin(): void
    {
        $profile = Profile::factory()->create();

        $this->getJson('/api/v1/admin/profiles')->assertUnauthorized();

        $this->actingAs(User::factory()->create());
        $this->getJson('/api/v1/admin/profiles')->assertForbidden();
        $this->postJson('/api/v1/admin/profiles', $this->profileData())->assertForbidden();
        $this->postJson('/api/v1/admin/profiles/import/preview', ['csv' => "first_name,last_name\nSarah,Kabeya"])->assertForbidden();
        $this->getJson("/api/v1/admin/profiles/{$profile->id}")->assertForbidden();
    }

    public function test_admin_creates_a_profile_without_user_and_contacts_are_normalized(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->postJson('/api/v1/admin/profiles', $this->profileData([
            'email' => ' PATRICK.K@example.test ',
            'phone' => '+243 (810) 000-001',
            'linkedin_url' => 'http://linkedin.com/in/patrick-k/?trk=profile',
        ]));

        $response->assertCreated()
            ->assertJsonPath('data.email', 'patrick.k@example.test')
            ->assertJsonPath('data.phone', '+243810000001')
            ->assertJsonPath('data.linkedin_url', 'https://www.linkedin.com/in/patrick-k')
            ->assertJsonPath('data.has_account', false)
            ->assertJsonPath('data.source', 'manual');

        $profile = Profile::sole();
        $this->assertNull($profile->user_id);
        $this->assertSame($admin->id, $profile->created_by);
        $this->assertSame(ProfileSource::Manual, $profile->source);
    }

    public function test_admin_can_search_filter_and_paginate_the_network(): void
    {
        Profile::factory()->create([
            'first_name' => 'Sarah',
            'last_name' => 'Kabeya',
            'company' => 'Atlas Capital',
            'availability' => Availability::Available,
        ]);
        Profile::factory()->create([
            'first_name' => 'Patrick',
            'last_name' => 'Ilunga',
            'company' => 'Immo Congo',
            'availability' => Availability::TemporarilyUnavailable,
        ]);

        $this->actingAs(User::factory()->admin()->create())
            ->getJson('/api/v1/admin/profiles?q=Atlas&availability=available&per_page=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.first_name', 'Sarah')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('meta.per_page', 1);
    }

    public function test_admin_can_show_and_update_a_profile_without_changing_ownership_metadata(): void
    {
        $creator = User::factory()->admin()->create();
        $profile = Profile::factory()->create([
            'created_by' => $creator->id,
            'email' => 'patrick@example.test',
            'source' => ProfileSource::Import,
        ]);
        $joinedAt = $profile->joined_at;
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->getJson("/api/v1/admin/profiles/{$profile->id}")
            ->assertOk()->assertJsonPath('data.email', 'patrick@example.test');

        $this->patchJson("/api/v1/admin/profiles/{$profile->id}", $this->profileData([
            'first_name' => 'Patrice',
            'email' => ' PATRICK@example.test ',
            'phone' => '+243 820 000 002',
        ]))->assertOk()
            ->assertJsonPath('data.first_name', 'Patrice')
            ->assertJsonPath('data.email', 'patrick@example.test')
            ->assertJsonPath('data.phone', '+243820000002');

        $profile->refresh();
        $this->assertSame($creator->id, $profile->created_by);
        $this->assertSame(ProfileSource::Import, $profile->source);
        $this->assertTrue($joinedAt->equalTo($profile->joined_at));
    }

    public function test_normalized_duplicate_contacts_are_rejected(): void
    {
        Profile::factory()->create([
            'email' => 'duplicate@example.test',
            'phone' => '+243810000010',
            'linkedin_url' => 'https://www.linkedin.com/in/duplicate-profile',
        ]);
        $this->actingAs(User::factory()->admin()->create());

        $this->postJson('/api/v1/admin/profiles', $this->profileData([
            'email' => ' DUPLICATE@example.test ',
            'phone' => null,
            'linkedin_url' => null,
        ]))->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->postJson('/api/v1/admin/profiles', $this->profileData([
            'email' => 'unique-phone@example.test',
            'phone' => '+243 (810) 000-010',
            'linkedin_url' => null,
        ]))->assertUnprocessable()->assertJsonValidationErrors('phone');

        $this->postJson('/api/v1/admin/profiles', $this->profileData([
            'email' => 'unique-linkedin@example.test',
            'phone' => null,
            'linkedin_url' => 'http://www.linkedin.com/in/duplicate-profile/',
        ]))->assertUnprocessable()->assertJsonValidationErrors('linkedin_url');

        $this->assertSame(1, Profile::count());
    }

    public function test_protected_profile_metadata_cannot_be_supplied(): void
    {
        $this->actingAs(User::factory()->admin()->create())
            ->postJson('/api/v1/admin/profiles', $this->profileData([
                'source' => 'import',
                'joined_at' => now()->toISOString(),
            ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['source', 'joined_at']);
    }

    public function test_admin_can_preview_then_import_a_csv_with_row_level_results(): void
    {
        Profile::factory()->create(['email' => 'existing@example.test']);
        $admin = User::factory()->admin()->create();
        $csv = implode("\n", [
            'first_name,last_name,email,phone,linkedin_url,company',
            'Sarah,Kabeya, SARAH@example.test ,+243 (810) 000-020,http://linkedin.com/in/sarah-k,Atlas Capital',
            'Existing,Person, EXISTING@example.test ,,,Existing Corp',
            'Invalid,,not-an-email,,,Unknown',
        ]);

        $this->actingAs($admin)->postJson('/api/v1/admin/profiles/import/preview', ['csv' => $csv])
            ->assertOk()
            ->assertJsonPath('data.counts.ready', 1)
            ->assertJsonPath('data.counts.duplicate', 1)
            ->assertJsonPath('data.counts.invalid', 1);
        $this->assertSame(1, Profile::count());

        $this->postJson('/api/v1/admin/profiles/import', ['csv' => $csv])
            ->assertOk()
            ->assertJsonPath('data.counts.created', 1)
            ->assertJsonPath('data.counts.duplicate', 1)
            ->assertJsonPath('data.counts.invalid', 1);

        $imported = Profile::where('email', 'sarah@example.test')->sole();
        $this->assertSame('+243810000020', $imported->phone);
        $this->assertSame('https://www.linkedin.com/in/sarah-k', $imported->linkedin_url);
        $this->assertSame(ProfileSource::Import, $imported->source);
        $this->assertSame($admin->id, $imported->created_by);
        $this->assertNull($imported->user_id);
    }

    public function test_invalid_csv_header_is_rejected_without_writes(): void
    {
        $this->actingAs(User::factory()->admin()->create())
            ->postJson('/api/v1/admin/profiles/import', ['csv' => "name,email\nSarah,sarah@example.test"])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('csv');

        $this->assertDatabaseCount('profiles', 0);
    }

    private function profileData(array $overrides = []): array
    {
        return array_merge([
            'first_name' => 'Patrick',
            'last_name' => 'Kalala',
            'email' => 'patrick@example.test',
            'phone' => '+243810000001',
            'linkedin_url' => 'https://www.linkedin.com/in/patrick-kalala',
            'company' => 'Entreprise Démo',
            'job_title' => 'Directeur',
            'sector' => 'Immobilier',
            'bio' => 'Profil professionnel fictif.',
            'interests' => 'Investissement',
            'looking_for' => 'Partenaires',
            'contributions' => 'Expérience sectorielle',
            'availability' => 'available',
        ], $overrides);
    }
}
