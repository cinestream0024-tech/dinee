<?php

use App\Http\Controllers\PublicInvitationController;
use App\Http\Controllers\SessionController;
use Illuminate\Support\Facades\Route;

// Session mutations always use the web middleware, including CSRF for every origin.
Route::post('/api/v1/auth/login', [SessionController::class, 'store'])->middleware('throttle:login');
Route::post('/api/v1/auth/logout', [SessionController::class, 'destroy'])->middleware('auth:sanctum');
Route::post('/api/v1/public/invitations/{token}/activate', [PublicInvitationController::class, 'activate'])
    ->middleware('throttle:public-invitation');
