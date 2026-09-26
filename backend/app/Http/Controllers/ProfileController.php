<?php

namespace App\Http\Controllers;

use App\Http\Requests\ListNetworkRequest;
use App\Http\Requests\SaveProfileRequest;
use App\Http\Resources\ProfileResource;
use App\Models\Profile;
use App\Services\ProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class ProfileController extends Controller
{
    public function index(ListNetworkRequest $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Profile::class);
        $data = $request->validated();
        $query = Profile::query()->when($data['q'] ?? null, fn ($query, $q) => $query->where(function ($query) use ($q) {
            foreach (['first_name', 'last_name', 'email', 'company', 'job_title', 'phone'] as $field) {
                $query->orWhere($field, 'like', '%'.$q.'%');
            }
        }))->when($data['availability'] ?? null, fn ($query, $value) => $query->where('availability', $value));

        return ProfileResource::collection($query->orderBy('last_name')->orderBy('first_name')->orderBy('id')->paginate($data['per_page'] ?? 20)->withQueryString());
    }

    public function store(SaveProfileRequest $request, ProfileService $service): ProfileResource
    {
        return new ProfileResource($service->save($request->validated(), $request->user()));
    }

    public function show(Profile $profile): ProfileResource
    {
        Gate::authorize('view', $profile);

        return new ProfileResource($profile);
    }

    public function update(SaveProfileRequest $request, Profile $profile, ProfileService $service): ProfileResource
    {
        return new ProfileResource($service->save($request->validated(), $request->user(), $profile));
    }

    public function history(Profile $profile, ProfileService $service): JsonResponse
    {
        Gate::authorize('view', $profile);

        return response()->json(['data' => $service->history($profile)]);
    }
}
