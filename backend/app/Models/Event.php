<?php

namespace App\Models;

use App\Enums\EventStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'starts_at', 'timezone', 'location', 'description', 'capacity'];

    protected function casts(): array
    {
        return ['starts_at' => 'immutable_datetime', 'status' => EventStatus::class];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function selections(): HasMany
    {
        return $this->hasMany(EventSelection::class);
    }
}
