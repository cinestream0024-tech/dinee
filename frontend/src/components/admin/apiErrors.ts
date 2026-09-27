import { ApiError } from "@/services/api";

export function apiErrorMessageKey(error: unknown): string {
  if (!(error instanceof ApiError) || error.status === 0)
    return "dinee.networkError";
  if (error.status === 403) return "dinee.forbiddenAction";
  if (error.status === 409) return "dinee.conflictAction";
  if (error.status === 419) return "dinee.sessionExpired";
  if (error.status === 422) return "dinee.reviewFields";
  return "dinee.unexpectedError";
}

export function hasFieldError(error: unknown, field: string): boolean {
  return error instanceof ApiError && Boolean(error.errors[field]?.length);
}
