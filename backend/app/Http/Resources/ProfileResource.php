<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'first_name' => $this->first_name, 'last_name' => $this->last_name,
            'photo_url' => $this->photo_path && $request->user()?->id === $this->user_id
                ? url('/api/v1/member/profile/photo/'.substr(hash('sha256', $this->photo_path), 0, 16))
                : null,
            'email' => $this->email, 'phone' => $this->phone, 'linkedin_url' => $this->linkedin_url,
            'company' => $this->company, 'job_title' => $this->job_title, 'sector' => $this->sector,
            'bio' => $this->bio, 'interests' => $this->interests, 'looking_for' => $this->looking_for, 'contributions' => $this->contributions,
            'availability' => $this->availability->value, 'source' => $this->source->value,
            'joined_at' => $this->joined_at?->toISOString(), 'has_account' => $this->user_id !== null,
        ];
    }
}
