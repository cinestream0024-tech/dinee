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
            'can_activate_account' => in_array($this->status->value, ['accepted', 'declined'], true)
                && ! $this->selection->profile->user_id,
            'has_member_account' => (bool) $this->selection->profile->user_id,
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
