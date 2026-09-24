<?php

use App\Http\Controllers\FoundationController;
use App\Http\Controllers\SessionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', [FoundationController::class, 'health']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/user', [SessionController::class, 'show']);
        Route::get('/admin/foundation', [FoundationController::class, 'admin'])->middleware('admin');
    });
});
