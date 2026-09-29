export class ApiError extends Error {
  public status: number;
  public errors: Record<string, string[]>;
  public detail?: string;

  constructor(
    status: number,
    errors: Record<string, string[]> = {},
    detail?: string,
  ) {
    super(`API ${status}`);
    this.status = status;
    this.errors = errors;
    this.detail = detail;
  }
}

const baseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");

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
    const payload = (await response.json().catch(() => ({}))) as {
      errors?: Record<string, string[]>;
      message?: string;
    };
    throw new ApiError(response.status, payload.errors ?? {}, payload.message);
  }

  return response.status === 204 ? (undefined as T) : response.json();
}

export const initializeCsrf = () => api<void>("/sanctum/csrf-cookie");

export async function apiMutation<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<T> {
  await initializeCsrf();

  return api<T>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
