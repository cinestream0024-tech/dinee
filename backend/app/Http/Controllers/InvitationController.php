<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateInvitationRequest;
use App\Http\Requests\ListInvitationsRequest;
use App\Http\Resources\InvitationResource;
use App\Models\Event;
use App\Models\EventSelection;
use App\Models\Invitation;
use App\Services\InvitationService;
use App\Services\InvitationWhatsAppMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class InvitationController extends Controller
{
    public function index(ListInvitationsRequest $request, Event $event): AnonymousResourceCollection
    {
        $query = Invitation::query()
            ->whereHas('selection', fn ($query) => $query->where('event_id', $event->id))
            ->with('selection.profile', 'selection.event')
            ->withCount('followUps')
            ->withMax('followUps', 'sent_at')
            ->latest('id');

        if ($status = $request->validated('status')) {
            $query->where('status', $status);
        }
        if ($request->has('sent')) {
            $request->boolean('sent') ? $query->whereNotNull('sent_at') : $query->whereNull('sent_at');
        }
        if ($request->boolean('follow_up_due')) {
            $query->dueForFollowUp();
        }

        return InvitationResource::collection(
            $query->paginate($request->validated('per_page', 20))->withQueryString()
        );
    }

    public function store(
        CreateInvitationRequest $request,
        Event $event,
        InvitationService $service,
        InvitationWhatsAppMessage $whatsAppMessage
    ): JsonResponse {
        $result = $service->create(
            $event,
            EventSelection::findOrFail($request->validated('selection_id'))
        );
        $data = (new InvitationResource($result['invitation']))->resolve($request);
        if ($result['plain_text_token']) {
            $data['public_token'] = $result['plain_text_token'];
            $data = [
                ...$data,
                ...$whatsAppMessage->compose($result['invitation'], $result['plain_text_token']),
            ];
        }

        return response()->json(
            ['data' => $data],
            $result['plain_text_token'] ? Response::HTTP_CREATED : Response::HTTP_OK
        );
    }

    public function show(Invitation $invitation): InvitationResource
    {
        Gate::authorize('view', $invitation);

        return new InvitationResource($invitation->load('selection.profile', 'selection.event'));
    }

    public function markSent(Invitation $invitation, InvitationService $service): InvitationResource
    {
        Gate::authorize('update', $invitation);

        return new InvitationResource($service->markSent($invitation));
    }

    public function rotateToken(
        Invitation $invitation,
        InvitationService $service,
        InvitationWhatsAppMessage $whatsAppMessage,
    ): JsonResponse {
        Gate::authorize('update', $invitation);

        $result = $service->rotateToken($invitation);
        $data = (new InvitationResource($result['invitation']))->resolve(request());
        $data['public_token'] = $result['plain_text_token'];
        $data = [
            ...$data,
            ...$whatsAppMessage->compose($result['invitation'], $result['plain_text_token']),
        ];

        return response()->json(['data' => $data]);
    }

    public function revokeToken(Invitation $invitation, InvitationService $service): InvitationResource
    {
        Gate::authorize('update', $invitation);

        return new InvitationResource($service->revokeToken($invitation));
    }

    public function cancel(Invitation $invitation, InvitationService $service): InvitationResource
    {
        Gate::authorize('update', $invitation);

        return new InvitationResource($service->cancel($invitation));
    }
}
