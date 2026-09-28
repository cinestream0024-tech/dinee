<?php

use App\Http\Controllers\EventController;
use App\Http\Controllers\FoundationController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProfileImportController;
use App\Http\Controllers\PublicInvitationController;
use App\Http\Controllers\SelectionController;
use App\Http\Controllers\SessionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', [FoundationController::class, 'health']);
    Route::middleware('throttle:public-invitation')->group(function () {
        Route::get('/public/invitations/{token}', [PublicInvitationController::class, 'show']);
        Route::post('/public/invitations/{token}/response', [PublicInvitationController::class, 'respond']);
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/user', [SessionController::class, 'show']);

        Route::prefix('admin')->middleware('admin')->group(function () {
            Route::get('/foundation', [FoundationController::class, 'admin']);
            Route::apiResource('events', EventController::class)->only(['index', 'store', 'show', 'update']);
            Route::get('/events/{event}/selections', [SelectionController::class, 'index']);
            Route::post('/events/{event}/selections', [SelectionController::class, 'store']);
            Route::delete('/events/{event}/selections/{profile}', [SelectionController::class, 'destroy']);
            Route::get('/events/{event}/invitations', [InvitationController::class, 'index']);
            Route::post('/events/{event}/invitations', [InvitationController::class, 'store']);
            Route::get('/invitations/{invitation}', [InvitationController::class, 'show']);
            Route::post('/invitations/{invitation}/mark-sent', [InvitationController::class, 'markSent']);
            Route::post('/invitations/{invitation}/rotate-token', [InvitationController::class, 'rotateToken']);
            Route::post('/invitations/{invitation}/revoke-token', [InvitationController::class, 'revokeToken']);
            Route::post('/invitations/{invitation}/cancel', [InvitationController::class, 'cancel']);
            Route::post('/profiles/import/preview', [ProfileImportController::class, 'preview']);
            Route::post('/profiles/import', [ProfileImportController::class, 'store']);
            Route::get('/profiles/{profile}/history', [ProfileController::class, 'history']);
            Route::apiResource('profiles', ProfileController::class)->only(['index', 'store', 'show', 'update']);
        });
    });
});
