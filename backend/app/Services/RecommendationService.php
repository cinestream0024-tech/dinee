<?php

namespace App\Services;

use App\Enums\ProfileSource;
use App\Enums\RecommendationStatus;
use App\Models\Profile;
use App\Models\Recommendation;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RecommendationService
{
    public function submit(Profile $recommender, array $data): Recommendation
    {
        $this->guardAgainstDuplicatePendingSubmission($recommender, $data);

        return DB::transaction(function () use ($recommender, $data) {
            $recommendation = new Recommendation;
            $recommendation->forceFill([
                ...$data,
                'recommender_profile_id' => $recommender->id,
                'status' => RecommendationStatus::Pending,
            ])->save();

            return $recommendation->refresh();
        });
    }

    public function accept(Recommendation $recommendation, User $reviewer, array $data): Recommendation
    {
        try {
            return DB::transaction(function () use ($recommendation, $reviewer, $data) {
                $record = Recommendation::lockForUpdate()->findOrFail($recommendation->id);
                $this->ensurePending($record);

                $profile = isset($data['existing_profile_id'])
                    ? Profile::findOrFail($data['existing_profile_id'])
                    : $this->createProfile($record, $reviewer, $data);

                $record->forceFill([
                    'recommended_profile_id' => $profile->id,
                    'status' => RecommendationStatus::Accepted,
                    'reviewed_by' => $reviewer->id,
                    'reviewed_at' => now(),
                ])->save();

                return $record->refresh();
            });
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages([
                'existing_profile_id' => ['duplicate_contact'],
            ]);
        }
    }

    public function reject(Recommendation $recommendation, User $reviewer): Recommendation
    {
        return DB::transaction(function () use ($recommendation, $reviewer) {
            $record = Recommendation::lockForUpdate()->findOrFail($recommendation->id);
            $this->ensurePending($record);
            $record->forceFill([
                'status' => RecommendationStatus::Rejected,
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now(),
            ])->save();

            return $record->refresh();
        });
    }

    private function createProfile(Recommendation $recommendation, User $reviewer, array $data): Profile
    {
        $profile = new Profile;
        $profile->fill([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $recommendation->email,
            'phone' => $recommendation->phone,
            'linkedin_url' => $recommendation->linkedin_url,
            'company' => $recommendation->company,
            'job_title' => $recommendation->job_title,
        ]);
        $profile->forceFill([
            'created_by' => $reviewer->id,
            'joined_at' => now(),
            'source' => ProfileSource::Recommendation,
        ])->save();

        return $profile;
    }

    private function ensurePending(Recommendation $recommendation): void
    {
        if ($recommendation->status !== RecommendationStatus::Pending) {
            throw ValidationException::withMessages([
                'status' => ['recommendation_already_reviewed'],
            ]);
        }
    }

    private function guardAgainstDuplicatePendingSubmission(Profile $recommender, array $data): void
    {
        $contacts = array_filter([
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'linkedin_url' => $data['linkedin_url'] ?? null,
        ]);
        if ($contacts === []) {
            return;
        }

        $duplicate = Recommendation::query()
            ->where('recommender_profile_id', $recommender->id)
            ->where('status', RecommendationStatus::Pending)
            ->where(function ($query) use ($contacts) {
                foreach ($contacts as $field => $value) {
                    $query->orWhere($field, $value);
                }
            })->exists();

        if ($duplicate) {
            throw ValidationException::withMessages([
                'contact' => ['duplicate_recommendation'],
            ]);
        }
    }
}
