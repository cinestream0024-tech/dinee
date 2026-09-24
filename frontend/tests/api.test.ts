import { afterEach, expect, it, vi } from "vitest";
import { api, ApiError } from "../src/services/api";
afterEach(() => {
  vi.unstubAllGlobals();
  document.cookie = "XSRF-TOKEN=; Max-Age=0";
});
it("sends the CSRF header and session cookies with mutations", async () => {
  document.cookie = "XSRF-TOKEN=encoded%3Dtoken";
  const fetcher = vi
    .fn()
    .mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetcher);
  await api("/api/v1/auth/logout", { method: "POST" });
  const [, options] = fetcher.mock.calls[0];
  expect(options.credentials).toBe("include");
  expect(options.referrer).toBe(`${window.location.origin}/`);
  expect(options.referrerPolicy).toBe("origin");
  expect(options.headers.get("X-XSRF-TOKEN")).toBe("encoded=token");
});
it.each([401, 403, 419, 422, 429])(
  "preserves HTTP %s and validation details",
  async (status) => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ errors: { email: ["Invalid"] } }), {
            status,
          }),
        ),
    );
    await expect(api("/api/v1/auth/login")).rejects.toMatchObject({
      status,
      errors: { email: ["Invalid"] },
    });
  },
);
it("distinguishes a network failure from an HTTP failure", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Offline")));
  await expect(api("/api/v1/health")).rejects.toEqual(new ApiError(0));
});
