import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import type { ReactNode } from "react";
import { AppWrapper } from "../src/components/common/PageMeta";
import { LanguageProvider } from "../src/context/LanguageContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import RecommendationsPage from "../src/pages/admin/RecommendationsPage";
import MemberRecommendationsPage from "../src/pages/member/MemberRecommendationsPage";
import i18n from "../src/i18n";

beforeEach(async () => {
  localStorage.setItem("i18nextLng", "fr");
  await i18n.changeLanguage("fr");
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

function mount(page: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <LanguageProvider>
          <AppWrapper>
            <MemoryRouter>{page}</MemoryRouter>
          </AppWrapper>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

it("lets a member submit a recommendation and keeps its status visible", async () => {
  let recommendations: unknown[] = [];
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/sanctum/csrf-cookie")) return new Response(null, { status: 204 });
    if (url.endsWith("/api/v1/member/recommendations") && init?.method === "POST") {
      const submitted = JSON.parse(String(init.body));
      const recommendation = { id: 1, ...submitted, status: "pending", created_at: new Date().toISOString(), reviewed_at: null };
      recommendations = [recommendation];
      return Response.json({ data: recommendation }, { status: 201 });
    }
    return Response.json({ data: recommendations });
  });
  vi.stubGlobal("fetch", fetcher);
  mount(<MemberRecommendationsPage />);

  await userEvent.type(screen.getByLabelText("Nom complet"), "Sarah Kabeya");
  await userEvent.type(screen.getByLabelText("Fonction"), "Investment Manager");
  await userEvent.type(screen.getByLabelText("Entreprise"), "Atlas Capital");
  await userEvent.type(screen.getByLabelText("Adresse e-mail"), "sarah@example.test");
  await userEvent.type(screen.getByLabelText("Pourquoi recommandez-vous cette personne ?"), "Son expérience serait très utile au réseau.");
  await userEvent.click(screen.getByRole("button", { name: "Envoyer la recommandation" }));

  expect(await screen.findByRole("status")).toHaveProperty("textContent", "Votre recommandation a bien été transmise à l’équipe DINEE.");
  expect(await screen.findByText("Sarah Kabeya")).toBeTruthy();
  expect(screen.getByText("En attente")).toBeTruthy();
});

it("requires an explicit admin confirmation before creating the recommended profile", async () => {
  let status = "pending";
  const recommendation = {
    id: 4,
    name: "Sarah Kabeya",
    job_title: "Investment Manager",
    company: "Atlas Capital",
    email: "sarah@example.test",
    phone: null,
    linkedin_url: null,
    reason: "Une expérience pertinente pour le réseau DINEE.",
    status,
    created_at: "2026-10-01T10:00:00.000Z",
    reviewed_at: null,
    recommender: { id: 2, name: "Patrick Démo", company: "Demo" },
    recommended_profile: null,
    potential_duplicates: [],
  };
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/sanctum/csrf-cookie")) return new Response(null, { status: 204 });
    if (url.endsWith("/accept") && init?.method === "POST") {
      status = "accepted";
      return Response.json({ data: { ...recommendation, status } });
    }
    return Response.json({ data: [{ ...recommendation, status }], meta: { current_page: 1, last_page: 1, per_page: 20, total: 1, from: 1, to: 1 } });
  });
  vi.stubGlobal("fetch", fetcher);
  mount(<RecommendationsPage />);

  await userEvent.click(await screen.findByRole("button", { name: "Étudier et accepter" }));
  expect((screen.getByLabelText("Prénom") as HTMLInputElement).value).toBe("Sarah");
  expect((screen.getByLabelText("Nom") as HTMLInputElement).value).toBe("Kabeya");
  await userEvent.click(screen.getByRole("button", { name: "Confirmer l’intégration" }));

  const request = fetcher.mock.calls.find(([input]) => String(input).endsWith("/accept"));
  expect(JSON.parse(String(request?.[1]?.body))).toEqual({ first_name: "Sarah", last_name: "Kabeya" });
  expect((await screen.findAllByText("Acceptée")).length).toBeGreaterThan(1);
});
