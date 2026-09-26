<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $count = $this->active_selections_count ?? 0;

        return [
            'id' => $this->id, 'title' => $this->title, 'starts_at' => $this->starts_at?->toISOString(),
            'starts_at_local' => $this->starts_at?->setTimezone($this->timezone)->format('Y-m-d\TH:i'),
            'timezone' => $this->timezone, 'location' => $this->location, 'description' => $this->description,
            'capacity' => $this->capacity, 'status' => $this->status->value, 'selected_count' => $count,
            'over_capacity' => $this->capacity !== null && $count > $this->capacity,
        ];
    }
}
