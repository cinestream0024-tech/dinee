<?php

namespace Tests\Feature;

use App\Enums\EventStatus;
use App\Models\Event;
use App\Models\Profile;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class FoundationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_can_exist_without_user_and_contacts_are_normalized(): void
    {
        $profile = Profile::factory()->create(['email' => ' PATRICK@example.test ', 'phone' => '+1 (202) 555-0100']);
        $this->assertNull($profile->user_id);
        $this->assertSame('patrick@example.test', $profile->email);
        $this->assertSame('+12025550100', $profile->phone);
        $this->assertSame(0, User::count());
        $this->assertSame('mysql', DB::connection()->getDriverName());
        $this->assertSame('dinee_test', DB::connection()->getDatabaseName());
    }

    public function test_member_can_only_view_own_profile_and_admin_can_view_network(): void
    {
        $member = User::factory()->create();
        $own = Profile::factory()->for($member)->create();
        $other = Profile::factory()->create();
        $this->assertTrue(Gate::forUser($member)->allows('view', $own));
        $this->assertFalse(Gate::forUser($member)->allows('view', $other));
        $this->assertFalse(Gate::forUser($member)->allows('viewAny', Profile::class));
        $this->assertTrue(Gate::forUser(User::factory()->admin()->create())->allows('view', $other));
    }

    public function test_event_factory_creates_draft_with_admin_owner(): void
    {
        $event = Event::factory()->create();
        $this->assertSame(EventStatus::Draft, $event->status);
        $this->assertTrue($event->creator->isAdmin());
        $this->assertFalse(Gate::forUser(User::factory()->create())->allows('view', $event));
        $this->assertTrue(Gate::forUser($event->creator)->allows('view', $event));
    }

    public function test_duplicate_normalized_email_is_rejected_by_database(): void
    {
        Profile::factory()->create(['email' => 'duplicate@example.test']);
        $this->expectException(QueryException::class);
        Profile::factory()->create(['email' => ' DUPLICATE@example.test ']);
    }

    public function test_user_cannot_have_two_profiles(): void
    {
        $user = User::factory()->create();
        Profile::factory()->for($user)->create();
        $this->expectException(QueryException::class);
        Profile::factory()->for($user)->create();
    }

    public function test_selection_pair_is_unique_and_foreign_keys_are_enforced(): void
    {
        $event = Event::factory()->create();
        $profile = Profile::factory()->create();
        $row = ['event_id' => $event->id, 'profile_id' => $profile->id, 'selected_by' => $event->created_by, 'selected_at' => now()];
        DB::table('event_selections')->insert($row);
        $this->expectException(QueryException::class);
        DB::table('event_selections')->insert($row);
    }

    public function test_selection_cannot_reference_missing_profile(): void
    {
        $event = Event::factory()->create();
        $this->expectException(QueryException::class);
        DB::table('event_selections')->insert(['event_id' => $event->id, 'profile_id' => 999999, 'selected_by' => $event->created_by, 'selected_at' => now()]);
    }

    public function test_demo_seeder_is_repeatable_and_preserves_existing_password(): void
    {
        $this->seed(DemoSeeder::class);
        $hash = User::where('email', 'yannick@dinee.test')->firstOrFail()->password;
        $this->seed(DemoSeeder::class);
        $this->assertSame(2, User::count());
        $this->assertSame(3, Profile::count());
        $this->assertSame(2, Profile::whereNull('user_id')->count());
        $this->assertSame(2, Event::count());
        $this->assertSame($hash, User::where('email', 'yannick@dinee.test')->firstOrFail()->password);
    }

    public function test_demo_seeder_refuses_production(): void
    {
        $this->app->instance('env', 'production');
        $this->expectException(\RuntimeException::class);
        (new DemoSeeder)->run();
    }
}
