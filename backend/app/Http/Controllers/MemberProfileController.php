<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateMemberProfileRequest;
use App\Http\Requests\UploadMemberProfilePhotoRequest;
use App\Http\Resources\ProfileResource;
use App\Models\Profile;
use App\Services\ProfileService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

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

    public function photo(Request $request): StreamedResponse
    {
        $profile = $this->profile($request);
        Gate::authorize('view', $profile);
        abort_unless($profile->photo_path && Storage::disk('local')->exists($profile->photo_path), 404);

        return Storage::disk('local')->response($profile->photo_path, null, [
            'Content-Disposition' => 'inline',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function updatePhoto(UploadMemberProfilePhotoRequest $request, ProfileService $service): ProfileResource
    {
        $profile = $this->profile($request);
        Gate::authorize('update', $profile);

        return new ProfileResource($service->replacePhoto($profile, $request->file('photo')));
    }

    public function destroyPhoto(Request $request, ProfileService $service): ProfileResource
    {
        $profile = $this->profile($request);
        Gate::authorize('update', $profile);

        return new ProfileResource($service->removePhoto($profile));
    }

    private function profile(Request $request): Profile
    {
        return $request->user()->profile()->firstOrFail();
    }
}
