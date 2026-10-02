<?php

namespace Tests\Feature;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MemberProfilePhotoApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_can_upload_and_read_their_private_profile_photo(): void
    {
        Storage::fake('local');
        $member = User::factory()->create();
        $profile = Profile::factory()->create(['user_id' => $member->id]);

        $response = $this->actingAs($member)->post('/api/v1/member/profile/photo', [
            'photo' => UploadedFile::fake()->image('portrait.jpg', 400, 400)->size(500),
        ], ['Accept' => 'application/json']);

        $path = $profile->fresh()->photo_path;
        $response->assertOk()
            ->assertJsonPath('data.id', $profile->id)
            ->assertJsonPath('data.photo_url', url('/api/v1/member/profile/photo/'.substr(hash('sha256', $path), 0, 16)));

        $this->assertNotNull($path);
        Storage::disk('local')->assertExists($path);

        $this->get('/api/v1/member/profile/photo/'.substr(hash('sha256', $path), 0, 16))
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertHeader('X-Content-Type-Options', 'nosniff');

        $otherMember = User::factory()->create();
        Profile::factory()->create(['user_id' => $otherMember->id]);
        $this->actingAs($otherMember)->get('/api/v1/member/profile/photo/'.substr(hash('sha256', $path), 0, 16))->assertNotFound();
    }

    public function test_replacing_then_removing_a_photo_cleans_stored_files(): void
    {
        Storage::fake('local');
        $member = User::factory()->create();
        $profile = Profile::factory()->create(['user_id' => $member->id]);
        Storage::disk('local')->put('profile-photos/old.jpg', 'old');
        $profile->forceFill(['photo_path' => 'profile-photos/old.jpg'])->save();

        $response = $this->actingAs($member)->post('/api/v1/member/profile/photo', [
            'photo' => UploadedFile::fake()->image('replacement.png', 300, 300)->size(400),
        ], ['Accept' => 'application/json'])->assertOk();

        $newPath = $profile->fresh()->photo_path;
        $response->assertJsonPath(
            'data.photo_url',
            url('/api/v1/member/profile/photo/'.substr(hash('sha256', $newPath), 0, 16)),
        );
        $this->assertNotSame(
            substr(hash('sha256', 'profile-photos/old.jpg'), 0, 16),
            substr(hash('sha256', $newPath), 0, 16),
        );
        Storage::disk('local')->assertMissing('profile-photos/old.jpg');
        Storage::disk('local')->assertExists($newPath);
        $this->get('/api/v1/member/profile/photo/'.substr(hash('sha256', 'profile-photos/old.jpg'), 0, 16))
            ->assertNotFound();

        $this->deleteJson('/api/v1/member/profile/photo')
            ->assertOk()
            ->assertJsonPath('data.photo_url', null);

        $this->assertNull($profile->fresh()->photo_path);
        Storage::disk('local')->assertMissing($newPath);
        $this->get('/api/v1/member/profile/photo/'.substr(hash('sha256', $newPath), 0, 16))->assertNotFound();
    }

    public function test_profile_photo_rejects_unsafe_formats_without_writing(): void
    {
        Storage::fake('local');
        $member = User::factory()->create();
        $profile = Profile::factory()->create(['user_id' => $member->id]);

        $this->actingAs($member)->post('/api/v1/member/profile/photo', [
            'photo' => UploadedFile::fake()->create('portrait.svg', 20, 'image/svg+xml'),
        ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('photo');

        $this->assertNull($profile->fresh()->photo_path);
        Storage::disk('local')->assertDirectoryEmpty('profile-photos');
    }

    public function test_photo_routes_refuse_guests_and_admins(): void
    {
        Storage::fake('local');
        $photo = fn () => UploadedFile::fake()->image('portrait.jpg', 200, 200);

        $this->post('/api/v1/member/profile/photo', ['photo' => $photo()], ['Accept' => 'application/json'])
            ->assertUnauthorized();

        $this->actingAs(User::factory()->admin()->create())
            ->post('/api/v1/member/profile/photo', ['photo' => $photo()], ['Accept' => 'application/json'])
            ->assertForbidden();
    }
}
