<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class FoundationController extends Controller
{
    public function health(): JsonResponse
    {
        return response()->json(['data' => ['status' => 'ok']]);
    }

    public function admin(): JsonResponse
    {
        Gate::authorize('viewAny', Event::class);
        DB::select('SELECT 1');

        return response()->json(['data' => ['status' => 'ready']]);
    }
}
