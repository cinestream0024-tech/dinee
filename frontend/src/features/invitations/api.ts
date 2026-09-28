import { api, apiMutation } from "@/services/api";
import type {
  AdminInvitation,
  InvitationMutationResult,
  InvitationStatus,
  PaginatedResponse,
  PublicInvitation,
  PublicInvitationResponsePayload,
} from "@/types/dinee";

export interface InvitationFilters {
  status?: InvitationStatus | "";
  sent?: boolean;
  followUpDue?: boolean;
  page?: number;
  perPage?: number;
}

export const invitationKeys = {
  all: ["invitations"] as const,
  admin: (eventId: number) =>
    [...invitationKeys.all, "admin", eventId] as const,
  list: (eventId: number, filters: InvitationFilters) =>
    [...invitationKeys.admin(eventId), "list", filters] as const,
  public: (token: string) => [...invitationKeys.all, "public", token] as const,
};

export function listInvitations(
  eventId: number,
  filters: InvitationFilters,
): Promise<PaginatedResponse<AdminInvitation>> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.sent !== undefined) params.set("sent", filters.sent ? "1" : "0");
  if (filters.followUpDue) params.set("follow_up_due", "1");
  if (filters.page && filters.page > 1)
    params.set("page", String(filters.page));
  params.set("per_page", String(filters.perPage ?? 20));

  return api<PaginatedResponse<AdminInvitation>>(
    `/api/v1/admin/events/${eventId}/invitations?${params.toString()}`,
  );
}

export function createInvitation(
  eventId: number,
  selectionId: number,
): Promise<{ data: InvitationMutationResult }> {
  return apiMutation(`/api/v1/admin/events/${eventId}/invitations`, "POST", {
    selection_id: selectionId,
  });
}

export function markInvitationSent(
  invitationId: number,
): Promise<{ data: AdminInvitation }> {
  return apiMutation(
    `/api/v1/admin/invitations/${invitationId}/mark-sent`,
    "POST",
  );
}

export function rotateInvitationToken(
  invitationId: number,
): Promise<{ data: InvitationMutationResult }> {
  return apiMutation(
    `/api/v1/admin/invitations/${invitationId}/rotate-token`,
    "POST",
  );
}

export function revokeInvitationToken(
  invitationId: number,
): Promise<{ data: AdminInvitation }> {
  return apiMutation(
    `/api/v1/admin/invitations/${invitationId}/revoke-token`,
    "POST",
  );
}

export function recordInvitationFollowUp(
  invitationId: number,
  operationId: string,
): Promise<{ data: AdminInvitation }> {
  return apiMutation(
    `/api/v1/admin/invitations/${invitationId}/follow-ups`,
    "POST",
    { operation_id: operationId },
  );
}

export function cancelInvitation(
  invitationId: number,
): Promise<{ data: AdminInvitation }> {
  return apiMutation(
    `/api/v1/admin/invitations/${invitationId}/cancel`,
    "POST",
  );
}

export function getPublicInvitation(
  token: string,
): Promise<{ data: PublicInvitation }> {
  return api(`/api/v1/public/invitations/${encodeURIComponent(token)}`);
}

export function respondToInvitation(
  token: string,
  payload: PublicInvitationResponsePayload,
): Promise<{ data: PublicInvitation }> {
  return apiMutation(
    `/api/v1/public/invitations/${encodeURIComponent(token)}/response`,
    "POST",
    payload,
  );
}
