<?php

namespace App\Models;

use App\Enums\RecommendationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Recommendation extends Model
{
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
}
