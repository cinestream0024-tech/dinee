<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AcceptRecommendationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() === true;
    }

    public function rules(): array
    {
        return [
            'existing_profile_id' => ['nullable', 'integer', 'exists:profiles,id'],
            'first_name' => ['required_without:existing_profile_id', 'nullable', 'string', 'max:100'],
            'last_name' => ['required_without:existing_profile_id', 'nullable', 'string', 'max:100'],
        ];
    }
}
