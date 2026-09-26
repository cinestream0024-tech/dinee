<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ListSelectionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('view', $this->route('event'));
    }

    public function rules(): array
    {
        return [
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
