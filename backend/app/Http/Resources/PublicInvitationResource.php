<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicInvitationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'status' => $this->status->value,
            'future_interest' => $this->future_interest,
            'responded_at' => $this->responded_at?->toISOString(),
            'expires_at' => $this->token_expires_at->toISOString(),
            'event' => [
                'title' => $this->selection->event->title,
                'starts_at' => $this->selection->event->starts_at?->toISOString(),
                'timezone' => $this->selection->event->timezone,
                'location' => $this->selection->event->location,
                'description' => $this->selection->event->description,
            ],
        ];
    }
}
