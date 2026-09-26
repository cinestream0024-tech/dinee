<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SelectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'selected_at' => $this->selected_at->toISOString(), 'profile' => new ProfileResource($this->profile)];
    }
}
