import { api, apiMutation } from "@/services/api";
import type { EventSelection, PaginatedResponse } from "@/types/dinee";

export const selectionKeys = {
  all: ["admin", "selections"] as const,
  event: (eventId: number) => [...selectionKeys.all, eventId] as const,
};

export async function listSelections(
  eventId: number,
): Promise<PaginatedResponse<EventSelection>> {
  return api<PaginatedResponse<EventSelection>>(
    `/api/v1/admin/events/${eventId}/selections?per_page=100`,
  );
}

export async function selectProfile(
  eventId: number,
  profileId: number,
): Promise<{ data: EventSelection }> {
  return apiMutation<{ data: EventSelection }>(
    `/api/v1/admin/events/${eventId}/selections`,
    "POST",
    { profile_id: profileId },
  );
}

export async function withdrawSelection(
  eventId: number,
  profileId: number,
): Promise<void> {
  return apiMutation<void>(
    `/api/v1/admin/events/${eventId}/selections/${profileId}`,
    "DELETE",
  );
}
