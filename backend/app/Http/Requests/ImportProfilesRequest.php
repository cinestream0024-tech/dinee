<?php

namespace App\Http\Requests;

use App\Models\Profile;
use Illuminate\Foundation\Http\FormRequest;

class ImportProfilesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Profile::class);
    }

    public function rules(): array
    {
        return ['csv' => ['required', 'string', 'max:524288']];
    }
}
