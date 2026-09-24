<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Services\SessionService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class SessionController extends Controller
{
    public function store(LoginRequest $request, SessionService $sessions): UserResource
    {
        return new UserResource($sessions->login($request, $request->validated()));
    }

    public function show(Request $request): UserResource
    {
        return new UserResource($request->user()->load('profile'));
    }

    public function destroy(Request $request, SessionService $sessions): Response
    {
        $sessions->logout($request);

        return response()->noContent();
    }
}
