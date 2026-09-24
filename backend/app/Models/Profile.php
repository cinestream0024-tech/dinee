<?php

namespace App\Models;

use App\Enums\Availability;
use App\Enums\ProfileSource;
use App\Support\ContactNormalizer;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Profile extends Model
{
    use HasFactory;

    protected $fillable = ['first_name', 'last_name', 'email', 'phone', 'linkedin_url', 'company', 'job_title', 'sector', 'bio', 'interests', 'looking_for', 'contributions', 'availability'];

    protected $hidden = ['photo_path'];

    protected function casts(): array
    {
        return ['joined_at' => 'datetime', 'availability' => Availability::class, 'source' => ProfileSource::class];
    }

    protected function email(): Attribute
    {
        return Attribute::make(set: fn (?string $value) => ContactNormalizer::email($value));
    }

    protected function phone(): Attribute
    {
        return Attribute::make(set: fn (?string $value) => ContactNormalizer::phone($value));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function selections(): HasMany
    {
        return $this->hasMany(EventSelection::class);
    }

    public function recommendations(): HasMany
    {
        return $this->hasMany(Recommendation::class, 'recommender_profile_id');
    }
}
