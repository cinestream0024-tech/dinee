<?php

namespace App\Enums;

enum ProfileSource: string
{
    case Manual = 'manual';
    case Import = 'import';
    case Recommendation = 'recommendation';
}
