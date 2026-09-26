<?php

namespace App\Support;

use App\Enums\Availability;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

final class ProfileInput
{
    public static function normalize(array $data): array
    {
        foreach (['email', 'phone'] as $field) {
            if (array_key_exists($field, $data) && (is_string($data[$field]) || $data[$field] === null)) {
                try {
                    $data[$field] = ContactNormalizer::$field($data[$field]);
                } catch (InvalidArgumentException) { /* Validation below returns a field error. */
                }
            }
        }
        if (isset($data['linkedin_url']) && is_string($data['linkedin_url'])) {
            $url = trim($data['linkedin_url']);
            $parts = parse_url($url);
            if (is_array($parts) && in_array(strtolower($parts['host'] ?? ''), ['linkedin.com', 'www.linkedin.com'], true)) {
                $data['linkedin_url'] = 'https://www.linkedin.com'.rtrim($parts['path'] ?? '', '/');
            }
        }

        return $data;
    }

    public static function rules(?int $ignoreId = null): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:254', Rule::unique('profiles', 'email')->ignore($ignoreId)],
            'phone' => ['nullable', 'string', 'regex:/^\+[1-9][0-9]{7,14}$/', Rule::unique('profiles', 'phone')->ignore($ignoreId)],
            'linkedin_url' => ['nullable', 'string', 'max:255', 'regex:~^https://www\.linkedin\.com/in/[A-Za-z0-9_%.-]+$~', Rule::unique('profiles', 'linkedin_url')->ignore($ignoreId)],
            'company' => ['nullable', 'string', 'max:255'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'sector' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'interests' => ['nullable', 'string', 'max:1000'],
            'looking_for' => ['nullable', 'string', 'max:1000'],
            'contributions' => ['nullable', 'string', 'max:1000'],
            'availability' => ['sometimes', Rule::enum(Availability::class)],
            'user_id' => ['prohibited'], 'created_by' => ['prohibited'], 'source' => ['prohibited'], 'joined_at' => ['prohibited'],
        ];
    }
}
