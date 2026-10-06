<?php

namespace App\Http\Resources;

use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminRecommendationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'job_title' => $this->job_title,
            'company' => $this->company,
            'email' => $this->email,
            'phone' => $this->phone,
            'linkedin_url' => $this->linkedin_url,
            'reason' => $this->reason,
            'status' => $this->status->value,
            'created_at' => $this->created_at?->toISOString(),
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'recommender' => $this->whenLoaded('recommender', fn () => [
                'id' => $this->recommender->id,
                'name' => trim($this->recommender->first_name.' '.$this->recommender->last_name),
                'company' => $this->recommender->company,
            ]),
            'recommended_profile' => $this->whenLoaded('recommendedProfile', fn () => $this->recommendedProfile ? [
                'id' => $this->recommendedProfile->id,
                'name' => trim($this->recommendedProfile->first_name.' '.$this->recommendedProfile->last_name),
            ] : null),
            'potential_duplicates' => $this->potentialDuplicates(),
        ];
    }

    private function potentialDuplicates(): array
    {
        $contacts = array_filter([
            'email' => $this->email,
            'phone' => $this->phone,
            'linkedin_url' => $this->linkedin_url,
        ]);
        if ($contacts === []) {
            return [];
        }

        return Profile::query()->where(function ($query) use ($contacts) {
            foreach ($contacts as $field => $value) {
                $query->orWhere($field, $value);
            }
        })->limit(5)->get()->map(fn (Profile $profile) => [
            'id' => $profile->id,
            'name' => trim($profile->first_name.' '.$profile->last_name),
            'company' => $profile->company,
        ])->all();
    }
}
