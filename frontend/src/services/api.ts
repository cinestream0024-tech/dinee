export class ApiError extends Error {
  public status: number;
  public errors: Record<string, string[]>;
  constructor(status: number, errors: Record<string, string[]> = {}) {
    super(`API ${status}`);
    this.status = status;
    this.errors = errors;
  }
}
const baseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  const csrf = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("XSRF-TOKEN="));
  if (csrf) headers.set("X-XSRF-TOKEN", decodeURIComponent(csrf.slice(11)));
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      credentials: "include",
      referrer: `${window.location.origin}/`,
      referrerPolicy: "origin",
    });
  } catch {
    throw new ApiError(0);
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new ApiError(response.status, payload.errors);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export const initializeCsrf = () => api<void>("/sanctum/csrf-cookie");
