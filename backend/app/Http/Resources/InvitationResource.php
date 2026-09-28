<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvitationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'sent_at' => $this->sent_at?->toISOString(),
            'responded_at' => $this->responded_at?->toISOString(),
            'future_interest' => $this->future_interest,
            'token_expires_at' => $this->token_expires_at->toISOString(),
            'token_revoked_at' => $this->token_revoked_at?->toISOString(),
            'follow_up_count' => $this->whenCounted('followUps'),
            'last_follow_up_at' => $this->follow_ups_max_sent_at?->toISOString(),
            'is_follow_up_due' => $this->isDueForFollowUp(),
            'selection' => [
                'id' => $this->selection->id,
                'selected_at' => $this->selection->selected_at->toISOString(),
                'profile' => new ProfileResource($this->selection->profile),
            ],
            'event' => [
                'id' => $this->selection->event->id,
                'title' => $this->selection->event->title,
                'starts_at' => $this->selection->event->starts_at?->toISOString(),
            ],
        ];
    }
}
