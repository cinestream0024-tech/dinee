<?php

namespace App\Http\Controllers;

use App\Http\Requests\ListNetworkRequest;
use App\Http\Requests\SelectProfileRequest;
use App\Http\Resources\SelectionResource;
use App\Models\Event;
use App\Models\Profile;
use App\Services\SelectionService;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class SelectionController extends Controller
{
    public function index(ListNetworkRequest $request, Event $event)
    {
        Gate::authorize('view', $event);

        return SelectionResource::collection($event->activeSelections()->with('profile')->orderByDesc('selected_at')->orderByDesc('id')->paginate($request->validated('per_page', 20)));
    }

    public function store(SelectProfileRequest $request, Event $event, SelectionService $service): SelectionResource
    {
        return new SelectionResource($service->select($event, Profile::findOrFail($request->validated('profile_id')), $request->user()));
    }

    public function destroy(Event $event, Profile $profile, SelectionService $service): Response
    {
        Gate::authorize('update', $event);
        $service->withdraw($event, $profile);

        return response()->noContent();
    }
}
