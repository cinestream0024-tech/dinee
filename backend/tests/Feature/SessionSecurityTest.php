<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SessionSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_malformed_email_is_validation_error_not_server_error(): void
    {
        $this->postJson('/api/v1/auth/login', ['email' => ['invalid'], 'password' => 'wrong'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_bearer_tokens_are_not_accepted_or_looked_up(): void
    {
        $this->withHeader('Authorization', 'Bearer 123|not-a-valid-token')
            ->getJson('/api/v1/auth/user')->assertUnauthorized();
    }

    public function test_private_response_is_not_cacheable(): void
    {
        $this->actingAs(User::factory()->create())
            ->getJson('/api/v1/auth/user')->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertHeader('Referrer-Policy', 'no-referrer');
    }

    public function test_logout_requires_csrf_even_for_an_authenticated_user(): void
    {
        $this->app->bind(PreventRequestForgery::class, fn ($app) => new class($app, $app['encrypter']) extends PreventRequestForgery
        {
            protected function runningUnitTests()
            {
                return false;
            }
        });
        $this->actingAs(User::factory()->create())->postJson('/api/v1/auth/logout')->assertStatus(419);
    }
}
