<?php

namespace App\Http\Controllers;

use App\Enums\InvitationStatus;
use App\Http\Requests\RespondToInvitationRequest;
use App\Http\Resources\MemberInvitationResource;
use App\Models\Invitation;
use App\Models\Profile;
use App\Services\InvitationService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class MemberInvitationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $profile = $this->profile($request);
        Gate::authorize('view', $profile);

        $invitations = Invitation::query()
            ->whereNotNull('sent_at')
            ->whereHas('selection', fn ($query) => $query->where('profile_id', $profile->id))
            ->with('selection.event')
            ->get()
            ->sortByDesc(fn (Invitation $invitation) => $invitation->selection->event->starts_at)
            ->values();

        return MemberInvitationResource::collection($invitations);
    }

    public function respond(
        RespondToInvitationRequest $request,
        Invitation $invitation,
        InvitationService $service,
    ): MemberInvitationResource {
        $profile = $this->profile($request);
        Gate::authorize('update', $profile);
        $status = InvitationStatus::from($request->validated('response'));
        $futureInterest = $status === InvitationStatus::Declined
            ? $request->boolean('future_interest')
            : null;

        return new MemberInvitationResource(
            $service->respondForMember($invitation, $profile, $status, $futureInterest)
        );
    }

    private function profile(Request $request): Profile
    {
        return $request->user()->profile()->firstOrFail();
    }
}
