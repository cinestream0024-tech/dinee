<?php

namespace App\Enums;

enum EventStatus: string
{
    case Draft = 'draft';
    case Upcoming = 'upcoming';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}
