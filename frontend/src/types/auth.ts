export type Role = "admin" | "member";
export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  profile_id: number | null;
}
