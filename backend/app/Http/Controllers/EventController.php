<?php

namespace App\Http\Controllers;

use App\Http\Requests\ListNetworkRequest;
use App\Http\Requests\SaveEventRequest;
use App\Http\Resources\EventResource;
use App\Models\Event;
use App\Services\EventService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class EventController extends Controller
{
    public function index(ListNetworkRequest $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Event::class);
        $data = $request->validated();
        $query = Event::query()->withCount('activeSelections')
            ->when($data['q'] ?? null, fn ($query, $q) => $query->where('title', 'like', '%'.$q.'%'))
            ->when($data['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($data['selectable'] ?? false, fn ($query) => $query->whereIn('status', ['draft', 'upcoming'])->where('starts_at', '>', now()));

        return EventResource::collection($query->orderByDesc('starts_at')->orderByDesc('id')->paginate($data['per_page'] ?? 20)->withQueryString());
    }

    public function store(SaveEventRequest $request, EventService $service): EventResource
    {
        return new EventResource($service->save($request->validated(), $request->user()));
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
