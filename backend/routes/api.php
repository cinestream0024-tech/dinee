<?php

use App\Http\Controllers\EventController;
use App\Http\Controllers\FoundationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProfileImportController;
use App\Http\Controllers\SelectionController;
use App\Http\Controllers\SessionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', [FoundationController::class, 'health']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/user', [SessionController::class, 'show']);

        Route::prefix('admin')->middleware('admin')->group(function () {
            Route::get('/foundation', [FoundationController::class, 'admin']);
            Route::apiResource('events', EventController::class)->only(['index', 'store', 'show', 'update']);
            Route::get('/events/{event}/selections', [SelectionController::class, 'index']);
            Route::post('/events/{event}/selections', [SelectionController::class, 'store']);
            Route::delete('/events/{event}/selections/{profile}', [SelectionController::class, 'destroy']);
            Route::post('/profiles/import/preview', [ProfileImportController::class, 'preview']);
            Route::post('/profiles/import', [ProfileImportController::class, 'store']);
            Route::get('/profiles/{profile}/history', [ProfileController::class, 'history']);
            Route::apiResource('profiles', ProfileController::class)->only(['index', 'store', 'show', 'update']);
        });
    });
});
