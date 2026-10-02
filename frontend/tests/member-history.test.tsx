import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { AppWrapper } from "../src/components/common/PageMeta";
import { LanguageProvider } from "../src/context/LanguageContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import MemberHistoryPage from "../src/pages/member/MemberHistoryPage";
import i18n from "../src/i18n";
import type { ProfileHistoryEntry } from "../src/types/dinee";

const history: ProfileHistoryEntry[] = [
  {
    event_id: 2,
    event_title: "DINEE de décembre",
    starts_at: "2099-12-10T18:00:00.000Z",
    timezone: "Africa/Kinshasa",
    location: "Gombe, Kinshasa",
    event_status: "upcoming",
    status: "accepted",
    invitation_status: "accepted",
    attendance_status: null,
    selected_at: "2099-11-10T10:00:00.000Z",
  },
  {
    event_id: 1,
    event_title: "DINEE de janvier",
    starts_at: "2020-01-10T18:00:00.000Z",
    timezone: "Africa/Kinshasa",
    location: null,
    event_status: "completed",
    status: "present",
    invitation_status: "accepted",
    attendance_status: "present",
    selected_at: "2020-01-01T10:00:00.000Z",
  },
];

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
              <MemberHistoryPage />
            </MemoryRouter>
          </AppWrapper>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

it("shows a labelled loading state while history is requested", () => {
  vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => undefined)));

  mount();

  expect(screen.getByRole("status", { name: "Chargement…" })).toBeTruthy();
});

it("shows upcoming and past events in a readable timeline", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({ data: history })),
  );

  mount();

  expect(
    screen.getByRole("heading", { name: "Mon parcours avec Le DINEE" }),
  ).toBeTruthy();
  expect(
    await screen.findByRole("heading", { name: "À venir" }),
  ).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Éditions passées" })).toBeTruthy();
  expect(screen.getByText("DINEE de décembre")).toBeTruthy();
  expect(screen.getByText("Gombe, Kinshasa")).toBeTruthy();
  expect(screen.getByText("Confirmé")).toBeTruthy();
  expect(screen.getByText("DINEE de janvier")).toBeTruthy();
  expect(screen.getByText("Présent")).toBeTruthy();
});

it("shows a calm empty state", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({ data: [] })),
  );

  mount();

  expect(await screen.findByText("Votre historique commence ici")).toBeTruthy();
});

it("offers a retry after a network error", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

  mount();

  expect(await screen.findByRole("alert")).toBeTruthy();
  await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
  expect(fetch).toHaveBeenCalledTimes(2);
});
