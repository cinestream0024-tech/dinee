<?php

namespace Tests\Unit;

use App\Support\ContactNormalizer;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class ContactNormalizerTest extends TestCase
{
    public function test_empty_contacts_are_null_and_email_aliases_are_preserved(): void
    {
        $this->assertNull(ContactNormalizer::email(' '));
        $this->assertNull(ContactNormalizer::phone(null));
        $this->assertSame('first.last+tag@example.test', ContactNormalizer::email(' First.Last+tag@EXAMPLE.TEST '));
    }

    public function test_ambiguous_local_phone_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        ContactNormalizer::phone('0812345678');
    }
}
