<?php

namespace App\Models;

use App\Enums\RecommendationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Recommendation extends Model
{
    use HasFactory;

    protected $guarded = ['*'];

    protected function casts(): array
    {
        return ['status' => RecommendationStatus::class, 'reviewed_at' => 'datetime'];
    }

    public function recommender(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'recommender_profile_id');
    }

    public function recommendedProfile(): BelongsTo
    {
        return $this->belongsTo(Profile::class, 'recommended_profile_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
