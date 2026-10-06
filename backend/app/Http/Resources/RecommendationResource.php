<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecommendationResource extends JsonResource
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
        ];
    }
}
