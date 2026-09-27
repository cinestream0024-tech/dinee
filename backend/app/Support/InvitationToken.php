<?php

namespace App\Support;

final class InvitationToken
{
    public static function issue(): array
    {
        $plainText = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');

        return ['plain_text' => $plainText, 'hash' => self::hash($plainText)];
    }

    public static function hash(string $plainText): string
    {
        return hash('sha256', $plainText);
    }
}
