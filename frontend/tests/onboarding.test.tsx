import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { AppWrapper } from "../src/components/common/PageMeta";
import { LanguageProvider } from "../src/context/LanguageContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import OnboardingWelcomePage from "../src/pages/member/OnboardingWelcomePage";
import OnboardingProfilePage from "../src/pages/member/OnboardingProfilePage";
import i18n from "../src/i18n";
import type { Profile } from "../src/types/dinee";

const member = {
  id: 12,
  name: "Patrick Démo",
  email: "patrick@example.test",
  role: "member",
  profile_id: 8,
};

const profile: Profile = {
  id: 8,
  first_name: "Patrick",
  last_name: "Démo",
  email: "patrick@example.test",
  phone: "+243810000099",
  linkedin_url: "https://www.linkedin.com/in/patrick-demo",
  company: "Atlas Capital",
  job_title: "Directeur",
  sector: "Investissement",
  bio: "Entrepreneur à Kinshasa.",
  interests: null,
  looking_for: null,
  contributions: null,
  availability: "unspecified",
  source: "manual",
  joined_at: null,
  has_account: true,
};

beforeEach(async () => {
  localStorage.setItem("i18nextLng", "fr");
  await i18n.changeLanguage("fr");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({ data: member })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
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
            <MemoryRouter initialEntries={["/onboarding"]}>
              <Routes>
                <Route path="/onboarding" element={<OnboardingWelcomePage />} />
                <Route
                  path="/onboarding/profile"
                  element={<p>Étape profil</p>}
                />
              </Routes>
            </MemoryRouter>
          </AppWrapper>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

it("welcomes the new member and explains the setup before continuing", async () => {
  mount();

  expect(
    await screen.findByRole("heading", { name: "Bienvenue, Patrick" }),
  ).toBeTruthy();
  const progress = screen.getByRole("progressbar");
  expect(progress.getAttribute("aria-valuenow")).toBe("1");
  expect(progress.getAttribute("aria-valuemax")).toBe("4");
  expect(screen.queryByText("Invitation confirmée")).toBeNull();
  expect(
    screen.getByText(/Quelques étapes simples nous permettront/),
  ).toBeTruthy();

  await userEvent.click(
    screen.getByRole("link", { name: "Suivant" }),
  );
  expect(await screen.findByText("Étape profil")).toBeTruthy();
});

it("lets the member complete the professional profile step", async () => {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/sanctum/csrf-cookie")) {
        return new Response(null, { status: 204 });
      }
      if (url.endsWith("/api/v1/member/profile") && init?.method === "PATCH") {
        const updates = JSON.parse(String(init.body));
        return Response.json({ data: { ...profile, ...updates } });
      }
      return Response.json({ data: profile });
    },
  );
  vi.stubGlobal("fetch", fetchMock);

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <LanguageProvider>
          <AppWrapper>
            <MemoryRouter initialEntries={["/onboarding/profile"]}>
              <Routes>
                <Route
                  path="/onboarding/profile"
                  element={<OnboardingProfilePage />}
                />
                <Route path="/member/profile" element={<p>Profil enregistré</p>} />
              </Routes>
            </MemoryRouter>
          </AppWrapper>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );

  expect(
    await screen.findByRole("heading", { name: "Votre profil professionnel" }),
  ).toBeTruthy();
  expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("2");
  const company = await screen.findByLabelText("Entreprise");
  await userEvent.clear(company);
  await userEvent.type(company, "Kivu Ventures");
  await userEvent.click(
    screen.getByRole("button", { name: "Suivant" }),
  );

  expect(await screen.findByText("Profil enregistré")).toBeTruthy();
  expect(
    fetchMock.mock.calls.some(
      ([input, init]) =>
        String(input).endsWith("/api/v1/member/profile") &&
        init?.method === "PATCH" &&
        String(init.body).includes('"company":"Kivu Ventures"'),
    ),
  ).toBe(true);
});
