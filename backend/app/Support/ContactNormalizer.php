<?php

namespace App\Support;

use InvalidArgumentException;

final class ContactNormalizer
{
    public static function email(?string $value): ?string
    {
        $value = mb_strtolower(trim($value ?? ''));
        if ($value === '') {
            return null;
        }
        if (! filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Invalid email address.');
        }

        return $value;
    }

    public static function phone(?string $value): ?string
    {
        $value = trim($value ?? '');
        if ($value === '') {
            return null;
        }
        $value = preg_replace('/[\s().-]+/', '', $value);
        if (! preg_match('/^\+[1-9][0-9]{7,14}$/', $value)) {
            throw new InvalidArgumentException('An explicit international phone prefix is required.');
        }

        return $value;
    }
}
