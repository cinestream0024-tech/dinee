export type EventStatus = "draft" | "upcoming" | "completed" | "cancelled";
export type EventPeriod = "future" | "past" | "unscheduled";
export type Availability =
  "unspecified" | "available" | "temporarily_unavailable";

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface DineeEvent {
  id: number;
  title: string;
  starts_at: string | null;
  starts_at_local: string | null;
  timezone: string;
  location: string | null;
  description: string | null;
  capacity: number | null;
  status: EventStatus;
  selected_count: number;
  over_capacity: boolean;
}

export interface EventPayload {
  title: string;
  starts_at_local: string | null;
  timezone: string;
  location: string | null;
  description: string | null;
  capacity: number | null;
  status: EventStatus;
}

export interface Profile {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  company: string | null;
  job_title: string | null;
  sector: string | null;
  bio: string | null;
  interests: string | null;
  looking_for: string | null;
  contributions: string | null;
  availability: Availability;
  source: "manual" | "import" | "recommendation";
  joined_at: string | null;
  has_account: boolean;
}

export interface ProfilePayload {
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  company: string | null;
  job_title: string | null;
  sector: string | null;
  bio: string | null;
  interests: string | null;
  looking_for: string | null;
  contributions: string | null;
  availability: Availability;
}

export interface EventSelection {
  id: number;
  selected_at: string;
  profile: Profile;
}

export interface ProfileHistoryEntry {
  event_id: number;
  event_title: string;
  starts_at: string | null;
  event_status: EventStatus;
  status:
    | "selected"
    | "withdrawn"
    | "pending"
    | "accepted"
    | "declined"
    | "cancelled"
    | "present"
    | "absent";
  selected_at: string;
}
export type InvitationStatus =
  "pending" | "accepted" | "declined" | "cancelled";

export interface AdminInvitation {
  id: number;
  status: InvitationStatus;
  sent_at: string | null;
  responded_at: string | null;
  future_interest: boolean | null;
  token_expires_at: string;
  token_revoked_at: string | null;
  follow_up_count?: number;
  last_follow_up_at: string | null;
  is_follow_up_due: boolean;
  selection: EventSelection;
  event: Pick<DineeEvent, "id" | "title" | "starts_at">;
}

export interface InvitationDelivery {
  public_token: string;
  public_url: string;
  whatsapp_message: string;
  whatsapp_url: string;
}

export type InvitationMutationResult = AdminInvitation &
  Partial<InvitationDelivery>;

export interface PublicInvitation {
  status: InvitationStatus;
  future_interest: boolean | null;
  responded_at: string | null;
  expires_at: string;
  event: {
    title: string;
    starts_at: string | null;
    timezone: string;
    location: string | null;
    description: string | null;
  };
}

export interface PublicInvitationResponsePayload {
  response: "accepted" | "declined";
  future_interest?: boolean;
}
