<?php

namespace App\Http\Requests;

use App\Support\ProfileInput;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMemberProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(ProfileInput::normalize($this->all()));
    }

    public function rules(): array
    {
        $rules = ProfileInput::rules($this->user()->profile?->id);
        $rules['first_name'][0] = 'sometimes';
        $rules['last_name'][0] = 'sometimes';

        return $rules;
    }
}
