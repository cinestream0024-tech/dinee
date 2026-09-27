<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Sanctum::getAccessTokenFromRequestUsing(fn () => null);
        RateLimiter::for('login', fn (Request $request) => [
            Limit::perMinute(20)->by('ip:'.$request->ip()),
            Limit::perMinute(5)->by('identity:'.hash('sha256', mb_strtolower(trim((is_string($request->input('email')) ? $request->input('email') : '')))).'|'.$request->ip()),
        ]);
        RateLimiter::for('public-invitation', fn (Request $request) => [
            Limit::perMinute(30)->by('ip:'.$request->ip()),
            Limit::perMinute(10)->by('invitation:'.hash('sha256', (string) $request->route('token')).'|'.$request->ip()),
        ]);
    }
}
