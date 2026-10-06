<?php

namespace App\Http\Requests;

use App\Support\ProfileInput;
use Illuminate\Foundation\Http\FormRequest;

class StoreRecommendationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $normalized = ProfileInput::normalize($this->all());
        foreach (['name', 'job_title', 'company', 'reason'] as $field) {
            if (isset($normalized[$field]) && is_string($normalized[$field])) {
                $normalized[$field] = trim($normalized[$field]);
            }
        }
        $this->merge($normalized);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:200'],
            'job_title' => ['required', 'string', 'max:255'],
            'company' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:254'],
            'phone' => ['nullable', 'string', 'regex:/^\+[1-9][0-9]{7,14}$/'],
            'linkedin_url' => ['nullable', 'string', 'max:255', 'regex:~^https://www\.linkedin\.com/in/[A-Za-z0-9_%.-]+$~'],
            'reason' => ['required', 'string', 'min:10', 'max:1500'],
            'recommender_profile_id' => ['prohibited'],
            'recommended_profile_id' => ['prohibited'],
            'status' => ['prohibited'],
            'reviewed_by' => ['prohibited'],
            'reviewed_at' => ['prohibited'],
        ];
    }
}
