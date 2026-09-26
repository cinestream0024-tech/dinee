<?php

namespace App\Http\Requests;

use App\Enums\Availability;
use App\Enums\EventStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListNetworkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return ['q' => ['nullable', 'string', 'max:100'], 'page' => ['sometimes', 'integer', 'min:1'], 'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'], 'status' => ['nullable', Rule::enum(EventStatus::class)], 'availability' => ['nullable', Rule::enum(Availability::class)], 'selectable' => ['sometimes', 'boolean']];
    }
}
