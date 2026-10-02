import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { AppWrapper } from "../src/components/common/PageMeta";
import { LanguageProvider } from "../src/context/LanguageContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import MemberInvitationsPage from "../src/pages/member/MemberInvitationsPage";
import i18n from "../src/i18n";
import type { MemberInvitation } from "../src/types/dinee";

const currentInvitation: MemberInvitation = {
  id: 12,
  status: "pending",
  future_interest: null,
  responded_at: null,
  can_respond: true,
  event: {
    id: 4,
    title: "DINEE Finance",
    starts_at: "2099-10-18T18:00:00.000Z",
    timezone: "Africa/Kinshasa",
    location: "Gombe, Kinshasa",
    description: "Un dîner privé.",
    status: "upcoming",
  },
};

const pastInvitation: MemberInvitation = {
  ...currentInvitation,
  id: 8,
  status: "accepted",
  can_respond: false,
  event: {
    ...currentInvitation.event,
    id: 2,
    title: "DINEE Leadership",
    starts_at: "2020-02-10T18:00:00.000Z",
    status: "completed",
  },
};

beforeEach(async () => {
  localStorage.setItem("i18nextLng", "fr");
  await i18n.changeLanguage("fr");
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <LanguageProvider>
          <AppWrapper>
            <MemoryRouter>
              <MemberInvitationsPage />
            </MemoryRouter>
          </AppWrapper>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

it("shows current and past invitations and accepts an invitation", async () => {
  const fetcher = vi.fn(async (input: RequestInfo | URL, options?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/sanctum/csrf-cookie"))
      return new Response(null, { status: 204 });
    if (options?.method === "POST")
      return Response.json({
        data: { ...currentInvitation, status: "accepted" },
      });
    return Response.json({ data: [currentInvitation, pastInvitation] });
  });
  vi.stubGlobal("fetch", fetcher);
  mount();

  expect(await screen.findByText("DINEE Finance")).toBeTruthy();
  expect(screen.getByText("DINEE Leadership")).toBeTruthy();
  expect(screen.getByRole("heading", { name: "À venir" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Éditions passées" })).toBeTruthy();

  await userEvent.click(screen.getByRole("button", { name: "Je serai présent" }));
  const currentCard = screen.getByText("DINEE Finance").closest("article");
  expect(currentCard).not.toBeNull();
  expect(await within(currentCard!).findByText("Confirmé")).toBeTruthy();
  const request = fetcher.mock.calls.find(([, options]) => options?.method === "POST");
  expect(JSON.parse(String(request?.[1]?.body))).toEqual({ response: "accepted" });
});

it("records a decline and future interest from the member space", async () => {
  const fetcher = vi.fn(async (input: RequestInfo | URL, options?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/sanctum/csrf-cookie"))
      return new Response(null, { status: 204 });
    if (options?.method === "POST")
      return Response.json({
        data: {
          ...currentInvitation,
          status: "declined",
          future_interest: true,
        },
      });
    return Response.json({ data: [currentInvitation] });
  });
  vi.stubGlobal("fetch", fetcher);
  mount();

  await userEvent.click(
    await screen.findByRole("button", { name: "Je ne serai pas disponible" }),
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Oui, pour une prochaine édition" }),
  );

  expect(await screen.findByText("Indisponible")).toBeTruthy();
  const request = fetcher.mock.calls.find(([, options]) => options?.method === "POST");
  expect(JSON.parse(String(request?.[1]?.body))).toEqual({
    response: "declined",
    future_interest: true,
  });
});
