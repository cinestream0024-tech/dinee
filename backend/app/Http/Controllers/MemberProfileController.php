<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateMemberProfileRequest;
use App\Http\Resources\ProfileResource;
use App\Models\Profile;
use App\Services\ProfileService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class MemberProfileController extends Controller
{
    public function show(Request $request): ProfileResource
    {
        $profile = $this->profile($request);
        Gate::authorize('view', $profile);

        return new ProfileResource($profile);
    }

    public function update(UpdateMemberProfileRequest $request, ProfileService $service): ProfileResource
    {
        $profile = $this->profile($request);
        Gate::authorize('update', $profile);

        return new ProfileResource($service->save($request->validated(), $request->user(), $profile));
    }

    private function profile(Request $request): Profile
    {
        return $request->user()->profile()->firstOrFail();
    }
}
