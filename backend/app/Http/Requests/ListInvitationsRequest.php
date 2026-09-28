<?php

namespace App\Http\Requests;

use App\Enums\InvitationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListInvitationsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('view', $this->route('event'));
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', Rule::enum(InvitationStatus::class)],
            'sent' => ['nullable', 'boolean'],
            'follow_up_due' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
