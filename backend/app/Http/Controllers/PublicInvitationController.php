<?php

namespace App\Http\Controllers;

use App\Enums\InvitationStatus;
use App\Http\Requests\ActivateInvitationAccountRequest;
use App\Http\Requests\RespondToInvitationRequest;
use App\Http\Resources\PublicInvitationResource;
use App\Http\Resources\UserResource;
use App\Services\InvitationService;
use Illuminate\Support\Facades\Auth;

class PublicInvitationController extends Controller
{
    public function show(string $token, InvitationService $service): PublicInvitationResource
    {
        return new PublicInvitationResource($service->findPublic($token));
    }

    public function respond(RespondToInvitationRequest $request, string $token, InvitationService $service): PublicInvitationResource
    {
        $status = InvitationStatus::from($request->validated('response'));
        $futureInterest = $status === InvitationStatus::Declined
            ? $request->boolean('future_interest')
            : null;

        return new PublicInvitationResource(
            $service->respond($token, $status, $futureInterest)
        );
    }

    public function activate(ActivateInvitationAccountRequest $request, string $token, InvitationService $service): UserResource
    {
        $user = $service->activateAccount($token, $request->validated('email'), $request->validated('password'));

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return new UserResource($user->load('profile'));
    }
}
