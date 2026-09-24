<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_read_session_or_admin_endpoint(): void
    {
        $this->getJson('/api/v1/auth/user')->assertUnauthorized();
        $this->getJson('/api/v1/admin/foundation')->assertUnauthorized();
    }

    public function test_login_normalizes_email_and_returns_safe_current_user(): void
    {
        $user = User::factory()->admin()->create(['email' => 'yannick@example.test']);
        $this->postJson('/api/v1/auth/login', ['email' => ' YANNICK@example.test ', 'password' => 'test-password'])
            ->assertOk()->assertJsonPath('data.role', 'admin')->assertJsonMissingPath('data.password')->assertJsonMissingPath('data.remember_token');
        $this->assertAuthenticatedAs($user);
        $this->getJson('/api/v1/auth/user')->assertOk()->assertJsonPath('data.id', $user->id);
        $this->getJson('/api/v1/admin/foundation')->assertOk();
    }

    public function test_invalid_credentials_and_missing_fields_are_rejected(): void
    {
        User::factory()->create(['email' => 'member@example.test']);
        $this->postJson('/api/v1/auth/login', ['email' => 'member@example.test', 'password' => 'wrong'])->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->postJson('/api/v1/auth/login', [])->assertUnprocessable()->assertJsonValidationErrors(['email', 'password']);
        $this->assertGuest();
    }

    public function test_member_cannot_access_admin_or_promote_role_during_login(): void
    {
        $member = User::factory()->create(['email' => 'member@example.test']);
        $this->postJson('/api/v1/auth/login', ['email' => $member->email, 'password' => 'test-password', 'role' => 'admin'])
            ->assertOk()->assertJsonPath('data.role', 'member');
        $this->getJson('/api/v1/admin/foundation')->assertForbidden();
        $this->assertFalse($member->fresh()->isAdmin());
    }

    public function test_logout_invalidates_authentication(): void
    {
        $this->actingAs(User::factory()->create())->postJson('/api/v1/auth/logout')->assertNoContent();
        $this->assertGuest('web');
        Auth::forgetGuards();
        $this->getJson('/api/v1/auth/user')->assertUnauthorized();
    }

    public function test_login_is_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/login', ['email' => 'unknown@example.test', 'password' => 'wrong'])->assertUnprocessable();
        }
        $this->postJson('/api/v1/auth/login', ['email' => 'unknown@example.test', 'password' => 'wrong'])->assertTooManyRequests();
    }

    public function test_login_requires_csrf_outside_the_test_bypass(): void
    {
        $this->app->bind(PreventRequestForgery::class, fn ($app) => new class($app, $app['encrypter']) extends PreventRequestForgery
        {
            protected function runningUnitTests()
            {
                return false;
            }
        });
        $this->postJson('/api/v1/auth/login', ['email' => 'unknown@example.test', 'password' => 'wrong'])->assertStatus(419);
    }

    public function test_cors_does_not_authorize_arbitrary_origins(): void
    {
        $this->withHeaders(['Origin' => 'https://untrusted.example', 'Access-Control-Request-Method' => 'POST'])
            ->options('/api/v1/auth/login')->assertHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5173');
        $this->withHeaders(['Origin' => 'http://127.0.0.1:5173', 'Access-Control-Request-Method' => 'POST'])
            ->options('/api/v1/auth/login')->assertHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5173');
    }
}
