<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'member'])->default('member')->index();
        });
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->unique()->constrained()->restrictOnDelete();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('photo_path')->nullable();
            $table->string('email', 254)->nullable()->unique();
            $table->string('phone', 16)->nullable()->unique();
            $table->string('linkedin_url', 255)->nullable()->unique();
            $table->string('company')->nullable();
            $table->string('job_title')->nullable();
            $table->string('sector')->nullable();
            $table->text('bio')->nullable();
            $table->text('interests')->nullable();
            $table->text('looking_for')->nullable();
            $table->text('contributions')->nullable();
            $table->enum('availability', ['unspecified', 'available', 'temporarily_unavailable'])->default('unspecified');
            $table->enum('source', ['manual', 'import', 'recommendation'])->default('manual');
            $table->timestamp('joined_at');
            $table->foreignId('created_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index(['last_name', 'first_name']);
        });
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->dateTime('starts_at')->nullable();
            $table->string('timezone', 64)->default('Africa/Kinshasa');
            $table->string('location')->nullable();
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('capacity')->nullable();
            $table->enum('status', ['draft', 'upcoming', 'completed', 'cancelled'])->default('draft');
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index(['status', 'starts_at']);
        });
        Schema::create('event_selections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->restrictOnDelete();
            $table->foreignId('profile_id')->constrained()->restrictOnDelete();
            $table->foreignId('selected_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('selected_at');
            $table->timestamp('withdrawn_at')->nullable();
            $table->timestamps();
            $table->unique(['event_id', 'profile_id']);
        });
        Schema::create('invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_selection_id')->unique()->constrained()->restrictOnDelete();
            $table->enum('status', ['pending', 'accepted', 'declined', 'cancelled'])->default('pending');
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->boolean('future_interest')->nullable();
            $table->char('token_hash', 64)->unique();
            $table->timestamp('token_expires_at');
            $table->timestamp('token_revoked_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'sent_at']);
        });
        Schema::create('invitation_follow_ups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invitation_id')->constrained()->restrictOnDelete();
            $table->foreignId('recorded_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('sent_at');
            $table->uuid('operation_id')->unique();
            $table->timestamps();
            $table->index(['invitation_id', 'sent_at']);
        });
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_selection_id')->unique()->constrained()->restrictOnDelete();
            $table->enum('status', ['present', 'absent']);
            $table->foreignId('recorded_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('recorded_at');
            $table->timestamps();
        });
        Schema::create('recommendations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recommender_profile_id')->constrained('profiles')->restrictOnDelete();
            $table->foreignId('recommended_profile_id')->nullable()->constrained('profiles')->restrictOnDelete();
            $table->string('name');
            $table->string('job_title');
            $table->string('company');
            $table->string('email', 254)->nullable();
            $table->string('phone', 16)->nullable();
            $table->string('linkedin_url')->nullable();
            $table->text('reason');
            $table->enum('status', ['pending', 'accepted', 'rejected'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        foreach (['recommendations', 'attendances', 'invitation_follow_ups', 'invitations', 'event_selections', 'events', 'profiles'] as $table) {
            Schema::dropIfExists($table);
        }
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('role'));
    }
};
