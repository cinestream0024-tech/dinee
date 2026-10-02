import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { AppWrapper } from "../src/components/common/PageMeta";
import { LanguageProvider } from "../src/context/LanguageContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import MemberProfilePage from "../src/pages/member/MemberProfilePage";
import i18n from "../src/i18n";
import type { Profile } from "../src/types/dinee";

const profile: Profile = {
  id: 3,
  first_name: "Patrick",
  last_name: "Démo",
  email: "patrick@dinee.test",
  phone: "+243810000099",
  linkedin_url: "https://www.linkedin.com/in/patrick-demo",
  company: "Atlas Capital",
  job_title: "Directeur",
  sector: "Investissement",
  bio: "Entrepreneur basé à Kinshasa.",
  interests: "Immobilier et financement",
  looking_for: "Des partenaires stratégiques",
  contributions: "Une expérience sectorielle",
  availability: "available",
  source: "manual",
  joined_at: "2026-09-27T10:00:00.000000Z",
  has_account: true,
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
              <MemberProfilePage />
            </MemoryRouter>
          </AppWrapper>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

it("shows the member professional profile and privacy context", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({ data: profile })),
  );

  mount();

  expect(
    await screen.findByRole("heading", { name: "Patrick Démo" }),
  ).toBeTruthy();
  expect(screen.getByText("Directeur · Atlas Capital")).toBeTruthy();
  expect(screen.getByText("Entrepreneur basé à Kinshasa.")).toBeTruthy();
  expect(screen.getByText("Des partenaires stratégiques")).toBeTruthy();
  expect(screen.getByText("Une expérience sectorielle")).toBeTruthy();
  expect(
    screen.getByText(
      "Ces informations sont visibles uniquement par l’équipe DINEE.",
    ),
  ).toBeTruthy();
  expect(
    screen
      .getByRole("link", { name: "Voir mon profil LinkedIn" })
      .getAttribute("href"),
  ).toBe(profile.linkedin_url);
});

it("shows a labelled loading state while the profile is requested", () => {
  vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => undefined)));

  mount();

  expect(screen.getByRole("status", { name: "Chargement…" })).toBeTruthy();
});

it("explains when no profile is linked to the member account", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("{}", { status: 404 })),
  );

  mount();

  expect((await screen.findByRole("alert")).textContent).toContain(
    "Profil indisponible",
  );
  expect(screen.queryByRole("button", { name: "Réessayer" })).toBeNull();
});

it("lets the member update their availability", async () => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/sanctum/csrf-cookie"))
      return new Response(null, { status: 204 });
    if (url.endsWith("/api/v1/member/profile") && init?.method === "PATCH") {
      return Response.json({
        data: { ...profile, availability: "temporarily_unavailable" },
      });
    }
    return Response.json({ data: profile });
  });
  vi.stubGlobal("fetch", fetchMock);

  mount();

  const unavailable = await screen.findByRole("radio", {
    name: "Temporairement indisponible",
  });
  await userEvent.click(unavailable);

  await screen.findByText("Votre disponibilité a été enregistrée.");
  expect((unavailable as HTMLInputElement).checked).toBe(true);
  await waitFor(() =>
    expect(
      fetchMock.mock.calls.some(
        ([input, init]) =>
          String(input).endsWith("/api/v1/member/profile") &&
          init?.method === "PATCH" &&
          init.body ===
            JSON.stringify({ availability: "temporarily_unavailable" }),
      ),
    ).toBe(true),
  );
});

it("keeps the current availability and explains a save failure", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/sanctum/csrf-cookie"))
        return new Response(null, { status: 204 });
      if (url.endsWith("/api/v1/member/profile") && init?.method === "PATCH")
        return Response.json({}, { status: 500 });
      return Response.json({ data: profile });
    }),
  );

  mount();

  await userEvent.click(
    await screen.findByRole("radio", {
      name: "Temporairement indisponible",
    }),
  );

  expect(
    await screen.findByText("Une erreur inattendue est survenue. Réessayez."),
  ).toBeTruthy();
  expect(
    (screen.getByRole("radio", { name: "Disponible" }) as HTMLInputElement)
      .checked,
  ).toBe(true);
});
