import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { AppWrapper } from "../src/components/common/PageMeta";
import { LanguageProvider } from "../src/context/LanguageContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import MemberProfileEditPage from "../src/pages/member/MemberProfileEditPage";
import MemberProfilePage from "../src/pages/member/MemberProfilePage";
import i18n from "../src/i18n";
import type { Profile } from "../src/types/dinee";

const initialProfile: Profile = {
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
  interests: "Immobilier",
  looking_for: "Partenaires",
  contributions: "Expérience sectorielle",
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

function mount(path = "/member/profile") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <LanguageProvider>
          <AppWrapper>
            <MemoryRouter initialEntries={[path]}>
              <Routes>
                <Route path="/member/profile" element={<MemberProfilePage />} />
                <Route
                  path="/member/profile/edit"
                  element={<MemberProfileEditPage />}
                />
              </Routes>
            </MemoryRouter>
          </AppWrapper>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

it("updates the member profile and returns with confirmation", async () => {
  let currentProfile = { ...initialProfile };
  let submitted: Record<string, unknown> | undefined;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, options?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/sanctum/csrf-cookie"))
        return new Response(null, { status: 204 });
      if (
        url.endsWith("/api/v1/member/profile") &&
        options?.method === "PATCH"
      ) {
        submitted = JSON.parse(String(options.body));
        currentProfile = { ...currentProfile, ...submitted };
        return Response.json({ data: currentProfile });
      }
      if (url.endsWith("/api/v1/member/profile"))
        return Response.json({ data: currentProfile });
      return new Response("{}", { status: 404 });
    }),
  );

  mount();
  await userEvent.click(
    await screen.findByRole("link", { name: "Modifier le profil" }),
  );
  const company = await screen.findByLabelText("Entreprise");
  await userEvent.clear(company);
  await userEvent.type(company, "Congo Ventures");
  await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

  expect(await screen.findByRole("status")).toHaveProperty(
    "textContent",
    "Votre profil a été mis à jour.",
  );
  expect(screen.getByText("Directeur · Congo Ventures")).toBeTruthy();
  expect(submitted?.company).toBe("Congo Ventures");
});

it("keeps entered values and shows field feedback after a 422 response", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, options?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/sanctum/csrf-cookie"))
        return new Response(null, { status: 204 });
      if (
        url.endsWith("/api/v1/member/profile") &&
        options?.method === "PATCH"
      ) {
        return Response.json(
          { errors: { email: ["validation.email"] } },
          { status: 422 },
        );
      }
      return Response.json({ data: initialProfile });
    }),
  );

  mount("/member/profile/edit");
  const email = await screen.findByLabelText("Adresse e-mail");
  await userEvent.clear(email);
  await userEvent.type(email, "adresse-invalide");
  await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

  expect(await screen.findByText("Vérifiez cette valeur.")).toBeTruthy();
  await waitFor(() =>
    expect((email as HTMLInputElement).value).toBe("adresse-invalide"),
  );
});
