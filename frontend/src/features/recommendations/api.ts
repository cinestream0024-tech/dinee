import { api, apiMutation } from "@/services/api";
import type {
  AdminRecommendation,
  PaginatedResponse,
  Recommendation,
  RecommendationPayload,
  RecommendationStatus,
} from "@/types/dinee";

export const recommendationKeys = {
  all: ["recommendations"] as const,
  member: () => [...recommendationKeys.all, "member"] as const,
  admin: (status: RecommendationStatus | "") =>
    [...recommendationKeys.all, "admin", status] as const,
};

export async function listMemberRecommendations(): Promise<Recommendation[]> {
  return (
    await api<{ data: Recommendation[] }>("/api/v1/member/recommendations")
  ).data;
}

export function submitRecommendation(
  payload: RecommendationPayload,
): Promise<{ data: Recommendation }> {
  return apiMutation("/api/v1/member/recommendations", "POST", payload);
}

export function listAdminRecommendations(
  status: RecommendationStatus | "",
): Promise<PaginatedResponse<AdminRecommendation>> {
  const query = status ? `?status=${status}` : "";
  return api(`/api/v1/admin/recommendations${query}`);
}

export function acceptRecommendation(
  id: number,
  payload: { existing_profile_id?: number; first_name?: string; last_name?: string },
): Promise<{ data: AdminRecommendation }> {
  return apiMutation(`/api/v1/admin/recommendations/${id}/accept`, "POST", payload);
}

export function rejectRecommendation(
  id: number,
): Promise<{ data: AdminRecommendation }> {
  return apiMutation(`/api/v1/admin/recommendations/${id}/reject`, "POST");
}
