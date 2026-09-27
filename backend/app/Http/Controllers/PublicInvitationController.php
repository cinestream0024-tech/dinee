<?php

namespace App\Http\Controllers;

use App\Enums\InvitationStatus;
use App\Http\Requests\RespondToInvitationRequest;
use App\Http\Resources\PublicInvitationResource;
use App\Services\InvitationService;

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
}
