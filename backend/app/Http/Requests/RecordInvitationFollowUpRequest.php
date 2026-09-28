<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RecordInvitationFollowUpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('invitation'));
    }

    public function rules(): array
    {
        return [
            'operation_id' => ['required', 'uuid'],
        ];
    }
}
