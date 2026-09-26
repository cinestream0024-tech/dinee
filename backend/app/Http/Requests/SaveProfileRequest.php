<?php

namespace App\Http\Requests;

use App\Models\Profile;
use App\Support\ProfileInput;
use Illuminate\Foundation\Http\FormRequest;

class SaveProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        $profile = $this->route('profile');

        return $profile ? $this->user()->can('update', $profile) : $this->user()->can('create', Profile::class);
    }

    protected function prepareForValidation(): void
    {
        $this->merge(ProfileInput::normalize($this->all()));
    }

    public function rules(): array
    {
        return ProfileInput::rules($this->route('profile')?->id);
    }
}
