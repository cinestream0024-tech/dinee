import { api, apiMutation } from "@/services/api";
import type {
  DineeEvent,
  EventPayload,
  EventPeriod,
  EventStatus,
  PaginatedResponse,
} from "@/types/dinee";

export interface EventFilters {
  q?: string;
  status?: EventStatus | "";
  period?: EventPeriod | "";
  page?: number;
  perPage?: number;
}

export const eventKeys = {
  all: ["admin", "events"] as const,
  list: (filters: EventFilters) => [...eventKeys.all, "list", filters] as const,
};

export async function listEvents(
  filters: EventFilters,
): Promise<PaginatedResponse<DineeEvent>> {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.period) params.set("period", filters.period);
  if (filters.page && filters.page > 1)
    params.set("page", String(filters.page));
  params.set("per_page", String(filters.perPage ?? 20));

  return api<PaginatedResponse<DineeEvent>>(
    `/api/v1/admin/events?${params.toString()}`,
  );
}

export async function saveEvent(
  payload: EventPayload,
  eventId?: number,
): Promise<{ data: DineeEvent }> {
  return apiMutation<{ data: DineeEvent }>(
    eventId ? `/api/v1/admin/events/${eventId}` : "/api/v1/admin/events",
    eventId ? "PATCH" : "POST",
    payload,
  );
}
