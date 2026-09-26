<?php

namespace App\Http\Requests;

use App\Enums\Availability;
use App\Models\Profile;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListProfilesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', Profile::class);
    }

    public function rules(): array
    {
        return [
            'q' => ['nullable', 'string', 'max:100'],
            'availability' => ['nullable', Rule::enum(Availability::class)],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
