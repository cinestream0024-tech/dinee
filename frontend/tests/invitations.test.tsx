import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { AppWrapper } from "../src/components/common/PageMeta";
import { LanguageProvider } from "../src/context/LanguageContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import InvitationsPage from "../src/pages/admin/InvitationsPage";
import InvitationPage from "../src/pages/public/InvitationPage";
import i18n from "../src/i18n";

const emptyMeta = {
  current_page: 1,
  from: null,
  last_page: 1,
  per_page: 20,
  to: null,
  total: 0,
};
const publicInvitation = {
  status: "pending",
  future_interest: null,
  responded_at: null,
  expires_at: "2099-10-18T18:00:00.000000Z",
  event: {
    title: "DINEE Finance",
    starts_at: "2099-10-18T18:00:00.000000Z",
    timezone: "Africa/Kinshasa",
    location: "Kinshasa",
    description: "Un dîner privé.",
  },
};

function providers(content: React.ReactNode, path: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <LanguageProvider>
          <AppWrapper>
            <MemoryRouter initialEntries={[path]}>{content}</MemoryRouter>
          </AppWrapper>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

function mountPublic() {
  return providers(
    <Routes>
      <Route path="/invitation/:token" element={<InvitationPage />} />
    </Routes>,
    "/invitation/secure-token",
  );
}

beforeEach(async () => {
  localStorage.setItem("i18nextLng", "fr");
  await i18n.changeLanguage("fr");
});

afterEach(() => vi.unstubAllGlobals());

it("accepts a public invitation without an account", async () => {
  const fetcher = vi.fn(
    async (input: RequestInfo | URL, options?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/sanctum/csrf-cookie"))
        return new Response(null, { status: 204 });
      if (options?.method === "POST")
        return Response.json({
          data: {
            ...publicInvitation,
            status: "accepted",
            responded_at: new Date().toISOString(),
          },
        });
      return Response.json({ data: publicInvitation });
    },
  );
  vi.stubGlobal("fetch", fetcher);
  mountPublic();

  await userEvent.click(
    await screen.findByRole("button", { name: "Je serai présent" }),
  );
  expect(await screen.findByText("Votre présence est confirmée")).toBeTruthy();
  const request = fetcher.mock.calls.find(
    ([, options]) => options?.method === "POST",
  );
  expect(JSON.parse(String(request?.[1]?.body))).toEqual({
    response: "accepted",
  });
});

it("records a decline with interest in a future event", async () => {
  const fetcher = vi.fn(
    async (input: RequestInfo | URL, options?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/sanctum/csrf-cookie"))
        return new Response(null, { status: 204 });
      if (options?.method === "POST")
        return Response.json({
          data: {
            ...publicInvitation,
            status: "declined",
            future_interest: true,
            responded_at: new Date().toISOString(),
          },
        });
      return Response.json({ data: publicInvitation });
    },
  );
  vi.stubGlobal("fetch", fetcher);
  mountPublic();

  await userEvent.click(
    await screen.findByRole("button", { name: "Je ne serai pas disponible" }),
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Oui, pour une prochaine édition" }),
  );
  expect(
    await screen.findByText(
      "Votre intérêt pour une prochaine édition a bien été conservé.",
    ),
  ).toBeTruthy();
  const request = fetcher.mock.calls.find(
    ([, options]) => options?.method === "POST",
  );
  expect(JSON.parse(String(request?.[1]?.body))).toEqual({
    response: "declined",
    future_interest: true,
  });
});

it("adds the follow-up filter to the admin invitation request", async () => {
  const event = {
    id: 1,
    title: "DINEE Finance",
    starts_at: "2099-10-18T18:00:00.000000Z",
    starts_at_local: "2099-10-18T19:00",
    timezone: "Africa/Kinshasa",
    location: "Kinshasa",
    description: null,
    capacity: 30,
    status: "upcoming",
    selected_count: 0,
    over_capacity: false,
  };
  const fetcher = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/v1/admin/events?"))
      return Response.json({
        data: [event],
        meta: { ...emptyMeta, total: 1, from: 1, to: 1 },
      });
    if (url.includes("/selections?"))
      return Response.json({ data: [], meta: emptyMeta });
    if (url.includes("/invitations?"))
      return Response.json({ data: [], meta: emptyMeta });
    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal("fetch", fetcher);
  providers(<InvitationsPage />, "/admin/invitations");

  await userEvent.click(
    await screen.findByRole("button", { name: "À relancer" }),
  );
  await waitFor(() =>
    expect(
      fetcher.mock.calls.some(([input]) =>
        String(input).includes("follow_up_due=1"),
      ),
    ).toBe(true),
  );
});
