<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRecommendationRequest;
use App\Http\Resources\RecommendationResource;
use App\Models\Profile;
use App\Models\Recommendation;
use App\Services\RecommendationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class MemberRecommendationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $profile = $this->profile($request);

        return RecommendationResource::collection(
            $profile->recommendations()->latest()->paginate(20)
        );
    }

    public function store(
        StoreRecommendationRequest $request,
        RecommendationService $service,
    ): JsonResponse {
        Gate::authorize('create', Recommendation::class);
        $recommendation = $service->submit($this->profile($request), $request->validated());

        return (new RecommendationResource($recommendation))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    private function profile(Request $request): Profile
    {
        return $request->user()->profile()->firstOrFail();
    }
}
