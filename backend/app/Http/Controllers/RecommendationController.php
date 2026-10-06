<?php

namespace App\Http\Controllers;

use App\Http\Requests\AcceptRecommendationRequest;
use App\Http\Requests\ListRecommendationsRequest;
use App\Http\Resources\AdminRecommendationResource;
use App\Models\Recommendation;
use App\Services\RecommendationService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class RecommendationController extends Controller
{
    public function index(ListRecommendationsRequest $request): AnonymousResourceCollection
    {
        Gate::authorize('review', Recommendation::class);
        $data = $request->validated();

        return AdminRecommendationResource::collection(
            Recommendation::query()
                ->with(['recommender', 'recommendedProfile'])
                ->when($data['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
                ->when($data['q'] ?? null, fn ($query, $search) => $query->where(function ($query) use ($search) {
                    foreach (['name', 'company', 'job_title', 'email', 'phone'] as $field) {
                        $query->orWhere($field, 'like', '%'.$search.'%');
                    }
                }))
                ->latest()
                ->paginate($data['per_page'] ?? 20)
                ->withQueryString()
        );
    }

    public function accept(
        AcceptRecommendationRequest $request,
        Recommendation $recommendation,
        RecommendationService $service,
    ): AdminRecommendationResource {
        Gate::authorize('review', Recommendation::class);

        return new AdminRecommendationResource(
            $service->accept($recommendation, $request->user(), $request->validated())
                ->load(['recommender', 'recommendedProfile'])
        );
    }

    public function reject(
        Request $request,
        Recommendation $recommendation,
        RecommendationService $service,
    ): AdminRecommendationResource {
        Gate::authorize('review', Recommendation::class);

        return new AdminRecommendationResource(
            $service->reject($recommendation, $request->user())
                ->load(['recommender', 'recommendedProfile'])
        );
    }
}
