<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImportProfilesRequest;
use App\Services\ProfileImportService;
use Illuminate\Http\JsonResponse;

class ProfileImportController extends Controller
{
    public function preview(ImportProfilesRequest $request, ProfileImportService $service): JsonResponse
    {
        return response()->json(['data' => $service->process($request->validated('csv'))]);
    }

    public function store(ImportProfilesRequest $request, ProfileImportService $service): JsonResponse
    {
        return response()->json(['data' => $service->process($request->validated('csv'), $request->user())]);
    }
}
