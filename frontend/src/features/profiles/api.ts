import { api, apiMutation } from "@/services/api";
import type {
  Availability,
  PaginatedResponse,
  Profile,
  ProfileHistoryEntry,
  ProfilePayload,
} from "@/types/dinee";

export interface ProfileFilters {
  q?: string;
  availability?: Availability | "";
  page?: number;
  perPage?: number;
}

export const profileKeys = {
  all: ["admin", "profiles"] as const,
  list: (filters: ProfileFilters) =>
    [...profileKeys.all, "list", filters] as const,
  history: (profileId: number) =>
    [...profileKeys.all, profileId, "history"] as const,
};

export const memberProfileKey = ["member", "profile"] as const;

export async function getMemberProfile(): Promise<Profile> {
  return (await api<{ data: Profile }>("/api/v1/member/profile")).data;
}

export async function updateMemberProfile(
  payload: Omit<ProfilePayload, "availability">,
): Promise<Profile> {
  return (
    await apiMutation<{ data: Profile }>(
      "/api/v1/member/profile",
      "PATCH",
      payload,
    )
  ).data;
}

export async function listProfiles(
  filters: ProfileFilters,
): Promise<PaginatedResponse<Profile>> {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.availability) params.set("availability", filters.availability);
  if (filters.page && filters.page > 1)
    params.set("page", String(filters.page));
  params.set("per_page", String(filters.perPage ?? 20));

  return api<PaginatedResponse<Profile>>(
    `/api/v1/admin/profiles?${params.toString()}`,
  );
}

export async function saveProfile(
  payload: ProfilePayload,
  profileId?: number,
): Promise<{ data: Profile }> {
  return apiMutation<{ data: Profile }>(
    profileId
      ? `/api/v1/admin/profiles/${profileId}`
      : "/api/v1/admin/profiles",
    profileId ? "PATCH" : "POST",
    payload,
  );
}

export async function getProfileHistory(
  profileId: number,
): Promise<{ data: ProfileHistoryEntry[] }> {
  return api<{ data: ProfileHistoryEntry[] }>(
    `/api/v1/admin/profiles/${profileId}/history`,
  );
}
