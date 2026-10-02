<?php

namespace App\Http\Resources;

use App\Enums\EventStatus;
use App\Enums\InvitationStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MemberInvitationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $event = $this->selection->event;
        $canRespond = $this->sent_at
            && $this->status !== InvitationStatus::Cancelled
            && ! $this->selection->withdrawn_at
            && $event->status === EventStatus::Upcoming
            && $event->starts_at?->isFuture();

        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'future_interest' => $this->future_interest,
            'responded_at' => $this->responded_at?->toISOString(),
            'can_respond' => (bool) $canRespond,
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'starts_at' => $event->starts_at?->toISOString(),
                'timezone' => $event->timezone,
                'location' => $event->location,
                'description' => $event->description,
                'status' => $event->status->value,
            ],
        ];
    }
}
