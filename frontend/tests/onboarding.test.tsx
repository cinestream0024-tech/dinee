import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { AppWrapper } from "../src/components/common/PageMeta";
import { LanguageProvider } from "../src/context/LanguageContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import OnboardingWelcomePage from "../src/pages/member/OnboardingWelcomePage";
import i18n from "../src/i18n";

const member = {
  id: 12,
  name: "Patrick Démo",
  email: "patrick@example.test",
  role: "member",
  profile_id: 8,
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
                  path="/member/profile/edit"
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
  expect(screen.getByText("Votre profil professionnel")).toBeTruthy();
  expect(screen.getByText("Vos intentions")).toBeTruthy();
  expect(screen.getByText("Vos préférences")).toBeTruthy();

  await userEvent.click(
    screen.getByRole("link", { name: "Commencer la configuration" }),
  );
  expect(await screen.findByText("Étape profil")).toBeTruthy();
});
