import { afterEach, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { AppWrapper } from "../src/components/common/PageMeta";
import { LanguageProvider } from "../src/context/LanguageContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import LoginPage from "../src/pages/public/LoginPage";
import RequireRole from "../src/features/auth/RequireRole";
import { useLogout } from "../src/features/auth/auth";
import "../src/i18n";
const admin = {
  id: 1,
  name: "Yannick Demo",
  email: "yannick@dinee.test",
  role: "admin",
  profile_id: null,
};
const member = { ...admin, id: 2, role: "member" };
afterEach(() => vi.unstubAllGlobals());
function mount(path = "/login") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Logout() {
    const mutation = useLogout();
    return <button onClick={() => mutation.mutate()}>Logout</button>;
  }
  render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <LanguageProvider>
          <AppWrapper>
            <MemoryRouter initialEntries={[path]}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forbidden" element={<div>Denied</div>} />
                <Route element={<RequireRole role="admin" />}>
                  <Route
                    path="/admin"
                    element={
                      <>
                        <div>Admin area</div>
                        <Logout />
                      </>
                    }
                  />
                </Route>
                <Route element={<RequireRole role="member" />}>
                  <Route path="/member" element={<div>Member area</div>} />
                </Route>
              </Routes>
            </MemoryRouter>
          </AppWrapper>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
  return client;
}
it.each(["admin", "member"])(
  "logs in and redirects the %s to the correct space",
  async (role) => {
    let authenticated = false;
    const identity = role === "admin" ? admin : member;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("csrf-cookie"))
          return new Response(null, { status: 204 });
        if (url.endsWith("/login")) {
          authenticated = true;
          return Response.json({ data: identity });
        }
        return authenticated
          ? Response.json({ data: identity })
          : new Response("{}", { status: 401 });
      }),
    );
    mount();
    await userEvent.type(
      screen.getByLabelText("Adresse e-mail"),
      identity.email,
    );
    await userEvent.type(
      screen.getByLabelText("Mot de passe"),
      "demo-password",
    );
    await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    expect(
      await screen.findByText(role === "admin" ? "Admin area" : "Member area"),
    ).toBeTruthy();
  },
);
it("blocks a member from rendering the admin area", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(Response.json({ data: member })),
      ),
  );
  mount("/admin");
  expect(await screen.findByText("Denied")).toBeTruthy();
  expect(screen.queryByText("Admin area")).toBeNull();
});
it("redirects an unauthenticated visitor to login", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(new Response("{}", { status: 401 })),
      ),
  );
  mount("/admin");
  expect(
    await screen.findByRole("button", { name: "Se connecter" }),
  ).toBeTruthy();
});
it("keeps a network error distinct from a logged out session", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Offline")));
  mount("/admin");
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.queryByLabelText("Mot de passe")).toBeNull();
});
it("clears private query data when logging out", async () => {
  let authenticated = true;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.endsWith("csrf-cookie"))
        return new Response(null, { status: 204 });
      if (url.endsWith("/logout")) {
        authenticated = false;
        return new Response(null, { status: 204 });
      }
      return authenticated
        ? Response.json({ data: admin })
        : new Response("{}", { status: 401 });
    }),
  );
  const client = mount("/admin");
  client.setQueryData(["private-record"], { secret: true });
  await userEvent.click(await screen.findByRole("button", { name: "Logout" }));
  await waitFor(() =>
    expect(client.getQueryData(["private-record"])).toBeUndefined(),
  );
});
it("displays a useful error when credentials are invalid", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (url.endsWith("csrf-cookie"))
        return new Response(null, { status: 204 });
      return new Response("{}", { status: url.endsWith("/login") ? 422 : 401 });
    }),
  );
  mount();
  await userEvent.type(
    screen.getByLabelText("Adresse e-mail"),
    "wrong@example.test",
  );
  await userEvent.type(screen.getByLabelText("Mot de passe"), "wrong");
  await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "Identifiants invalides",
  );
});
