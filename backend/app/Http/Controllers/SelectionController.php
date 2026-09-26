<?php

namespace App\Http\Controllers;

use App\Http\Requests\ListSelectionsRequest;
use App\Http\Requests\SelectProfileRequest;
use App\Http\Resources\SelectionResource;
use App\Models\Event;
use App\Models\Profile;
use App\Services\SelectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class SelectionController extends Controller
{
    public function index(ListSelectionsRequest $request, Event $event): AnonymousResourceCollection
    {
        Gate::authorize('view', $event);

        return SelectionResource::collection(
            $event->activeSelections()
                ->with('profile')
                ->orderByDesc('selected_at')
                ->orderByDesc('id')
                ->paginate($request->validated('per_page', 20))
                ->withQueryString()
        );
    }

    public function store(SelectProfileRequest $request, Event $event, SelectionService $service): JsonResponse
    {
        $selection = $service->select(
            $event,
            Profile::findOrFail($request->validated('profile_id')),
            $request->user()
        );

        return (new SelectionResource($selection))
            ->response()
            ->setStatusCode($selection->wasRecentlyCreated ? HttpResponse::HTTP_CREATED : HttpResponse::HTTP_OK);
    }

    public function destroy(Event $event, Profile $profile, SelectionService $service): Response
    {
        Gate::authorize('update', $event);
        $service->withdraw($event, $profile);

        return response()->noContent();
    }
}
