<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SelectProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('event'));
    }

    public function rules(): array
    {
        return ['profile_id' => ['required', 'integer', 'exists:profiles,id']];
    }
}
