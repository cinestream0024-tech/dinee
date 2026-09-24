<?php

namespace App\Enums;

enum Availability: string
{
    case Unspecified = 'unspecified';
    case Available = 'available';
    case TemporarilyUnavailable = 'temporarily_unavailable';
}
