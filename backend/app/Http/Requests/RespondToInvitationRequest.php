<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RespondToInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'response' => ['required', Rule::in(['accepted', 'declined'])],
            'future_interest' => [
                'nullable',
                'boolean',
                Rule::requiredIf(fn () => $this->input('response') === 'declined'),
                Rule::prohibitedIf(fn () => $this->input('response') === 'accepted'),
            ],
        ];
    }
}
