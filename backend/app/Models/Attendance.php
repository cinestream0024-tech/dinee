<?php

namespace App\Models;

use App\Enums\AttendanceStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    protected $guarded = ['*'];

    protected function casts(): array
    {
        return ['status' => AttendanceStatus::class, 'recorded_at' => 'datetime'];
    }

    public function selection(): BelongsTo
    {
        return $this->belongsTo(EventSelection::class, 'event_selection_id');
    }
}
