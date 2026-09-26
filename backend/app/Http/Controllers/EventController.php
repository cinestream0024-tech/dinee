<?php

namespace App\Http\Controllers;

use App\Http\Requests\ListEventsRequest;
use App\Http\Requests\SaveEventRequest;
use App\Http\Resources\EventResource;
use App\Models\Event;
use App\Services\EventService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class EventController extends Controller
{
    public function index(ListEventsRequest $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Event::class);
        $data = $request->validated();
        $period = $data['period'] ?? null;

        $query = Event::query()
            ->withCount('activeSelections')
            ->when($data['q'] ?? null, fn ($query, $q) => $query->where('title', 'like', '%'.$q.'%'))
            ->when($data['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($period === 'future', fn ($query) => $query->where('starts_at', '>=', now()))
            ->when($period === 'past', fn ($query) => $query->where('starts_at', '<', now()))
            ->when($period === 'unscheduled', fn ($query) => $query->whereNull('starts_at'));

        $query = $period === 'future'
            ? $query->orderBy('starts_at')->orderBy('id')
            : $query->orderByDesc('starts_at')->orderByDesc('id');

        return EventResource::collection(
            $query->paginate($data['per_page'] ?? 20)->withQueryString()
        );
    }

    public function store(SaveEventRequest $request, EventService $service): JsonResponse
    {
        return (new EventResource($service->save($request->validated(), $request->user())))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Event $event): EventResource
    {
        Gate::authorize('view', $event);

        return new EventResource($event->loadCount('activeSelections'));
    }

    public function update(SaveEventRequest $request, Event $event, EventService $service): EventResource
    {
        return new EventResource($service->save($request->validated(), $request->user(), $event));
    }
}
