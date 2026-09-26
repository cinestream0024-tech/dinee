<?php

namespace App\Http\Requests;

use App\Enums\EventStatus;
use App\Models\Event;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        $event = $this->route('event');

        return $event ? $this->user()->can('update', $event) : $this->user()->can('create', Event::class);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'starts_at_local' => ['nullable', 'date_format:Y-m-d\TH:i'],
            'timezone' => ['required', 'timezone'],
            'location' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'status' => ['required', Rule::enum(EventStatus::class)],
            'created_by' => ['prohibited'],
        ];
    }
}
