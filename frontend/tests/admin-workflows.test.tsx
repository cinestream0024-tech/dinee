import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { AppWrapper } from "../src/components/common/PageMeta";
import { LanguageProvider } from "../src/context/LanguageContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import EventsPage from "../src/pages/admin/EventsPage";
import NetworkPage from "../src/pages/admin/NetworkPage";
import i18n from "../src/i18n";
import type { DineeEvent, EventSelection, Profile } from "../src/types/dinee";

const meta = {
  current_page: 1,
  from: 1,
  last_page: 1,
  per_page: 20,
  to: 1,
  total: 1,
};
const emptyMeta = { ...meta, from: null, to: null, total: 0 };

const profile: Profile = {
  id: 10,
  first_name: "Sarah",
  last_name: "Kabeya",
  email: "sarah@example.test",
  phone: "+243810000020",
  linkedin_url: "https://www.linkedin.com/in/sarah-kabeya",
  company: "Atlas Capital",
  job_title: "Investment Manager",
  sector: "Finance",
  bio: null,
  interests: null,
  looking_for: null,
  contributions: null,
  availability: "available",
  source: "manual",
  joined_at: "2026-09-27T10:00:00.000000Z",
  has_account: false,
};

const dineeEvent: DineeEvent = {
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

function mount(page: React.ReactNode, path: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <LanguageProvider>
          <AppWrapper>
            <MemoryRouter initialEntries={[path]}>{page}</MemoryRouter>
          </AppWrapper>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
  return client;
}

beforeEach(async () => {
  localStorage.setItem("i18nextLng", "fr");
  await i18n.changeLanguage("fr");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

it("creates a profile after preserving and showing validation feedback", async () => {
  const created = {
    ...profile,
    id: 11,
    first_name: "Patrick",
    last_name: "Kalala",
    email: "patrick@example.test",
  };
  let records: Profile[] = [];
  const fetcher = vi.fn(
    async (input: RequestInfo | URL, options?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/sanctum/csrf-cookie"))
        return new Response(null, { status: 204 });
      if (url.includes("/api/v1/admin/profiles?") && !options?.method) {
        return Response.json({
          data: records,
          meta: records.length ? meta : emptyMeta,
        });
      }
      if (
        url.endsWith("/api/v1/admin/profiles") &&
        options?.method === "POST"
      ) {
        records = [created];
        return Response.json({ data: created }, { status: 201 });
      }
      throw new Error(`Unexpected request: ${options?.method ?? "GET"} ${url}`);
    },
  );
  vi.stubGlobal("fetch", fetcher);
  mount(<NetworkPage />, "/admin/network");

  await screen.findByText("Aucun profil");
  await userEvent.click(
    screen.getAllByRole("button", { name: "Nouveau profil" })[0],
  );
  await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
  expect(screen.getAllByText("Ce champ est obligatoire.")).toHaveLength(2);

  await userEvent.type(
    screen.getByRole("textbox", { name: /Prénom/ }),
    "Patrick",
  );
  await userEvent.type(screen.getByRole("textbox", { name: /^Nom/ }), "Kalala");
  await userEvent.type(
    screen.getByRole("textbox", { name: /Adresse e-mail/ }),
    "patrick@example.test",
  );
  await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

  expect(
    await screen.findByText("Le profil de Patrick Kalala a été enregistré."),
  ).toBeTruthy();
  const request = fetcher.mock.calls.find(
    ([, options]) => options?.method === "POST",
  );
  expect(JSON.parse(String(request?.[1]?.body))).toMatchObject({
    first_name: "Patrick",
    last_name: "Kalala",
    email: "patrick@example.test",
  });
});

it("creates a draft event and only offers backend-supported creation statuses", async () => {
  let records: DineeEvent[] = [];
  const created = {
    ...dineeEvent,
    status: "draft" as const,
    starts_at: null,
    starts_at_local: null,
  };
  const fetcher = vi.fn(
    async (input: RequestInfo | URL, options?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/sanctum/csrf-cookie"))
        return new Response(null, { status: 204 });
      if (url.includes("/api/v1/admin/events?") && !options?.method) {
        return Response.json({
          data: records,
          meta: records.length ? meta : emptyMeta,
        });
      }
      if (url.endsWith("/api/v1/admin/events") && options?.method === "POST") {
        records = [created];
        return Response.json({ data: created }, { status: 201 });
      }
      throw new Error(`Unexpected request: ${options?.method ?? "GET"} ${url}`);
    },
  );
  vi.stubGlobal("fetch", fetcher);
  mount(<EventsPage />, "/admin/events");

  await screen.findByText("Aucune édition");
  await userEvent.click(
    screen.getAllByRole("button", { name: "Nouvelle édition" })[0],
  );
  expect(
    screen.getByRole("heading", { name: "Nouvelle édition" }),
  ).toBeTruthy();
  const dialog = screen.getByRole("dialog");
  const status = within(dialog).getByLabelText(/Statut/);
  expect(within(status).queryByRole("option", { name: "Annulée" })).toBeNull();
  expect(
    within(status).getByRole("option", { name: "Brouillon" }),
  ).toBeTruthy();
  expect(within(status).getByRole("option", { name: "À venir" })).toBeTruthy();

  await userEvent.type(
    within(dialog).getAllByRole("textbox")[0],
    "DINEE Finance",
  );
  await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
  expect(
    await screen.findByText("L’édition « DINEE Finance » a été enregistrée."),
  ).toBeTruthy();

  const request = fetcher.mock.calls.find(
    ([, options]) => options?.method === "POST",
  );
  expect(JSON.parse(String(request?.[1]?.body))).toMatchObject({
    title: "DINEE Finance",
    status: "draft",
    starts_at_local: null,
  });
});

it("adds and removes a person from an event selection", async () => {
  let selected = false;
  const selection: EventSelection = {
    id: 50,
    selected_at: "2026-09-27T10:00:00.000000Z",
    profile,
  };
  const fetcher = vi.fn(
    async (input: RequestInfo | URL, options?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/sanctum/csrf-cookie"))
        return new Response(null, { status: 204 });
      if (url.includes("/events/1/selections") && !options?.method) {
        return Response.json({
          data: selected ? [selection] : [],
          meta: selected ? meta : emptyMeta,
        });
      }
      if (url.endsWith("/events/1/selections") && options?.method === "POST") {
        selected = true;
        return Response.json({ data: selection }, { status: 201 });
      }
      if (
        url.endsWith("/events/1/selections/10") &&
        options?.method === "DELETE"
      ) {
        selected = false;
        return new Response(null, { status: 204 });
      }
      if (url.includes("/api/v1/admin/events?") && !options?.method) {
        return Response.json({
          data: [{ ...dineeEvent, selected_count: selected ? 1 : 0 }],
          meta,
        });
      }
      if (url.includes("/api/v1/admin/profiles?") && !options?.method) {
        return Response.json({ data: [profile], meta });
      }
      throw new Error(`Unexpected request: ${options?.method ?? "GET"} ${url}`);
    },
  );
  vi.stubGlobal("fetch", fetcher);
  vi.stubGlobal(
    "confirm",
    vi.fn(() => true),
  );
  mount(<EventsPage />, "/admin/events");

  await userEvent.click(
    await screen.findByRole("button", {
      name: "Gérer la sélection de DINEE Finance",
    }),
  );
  await userEvent.click(await screen.findByRole("button", { name: "Ajouter" }));
  const removeButton = await screen.findByRole("button", {
    name: "Retirer Sarah Kabeya de la sélection",
  });
  expect(selected).toBe(true);

  await userEvent.click(removeButton);
  await waitFor(() => expect(selected).toBe(false));
  expect(
    fetcher.mock.calls.some(
      ([url, options]) =>
        String(url).endsWith("/selections/10") && options?.method === "DELETE",
    ),
  ).toBe(true);
});

it("shows a profile history", async () => {
  const fetcher = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/v1/admin/profiles?"))
      return Response.json({ data: [profile], meta });
    if (url.endsWith("/profiles/10/history")) {
      return Response.json({
        data: [
          {
            event_id: 1,
            event_title: "DINEE Finance",
            starts_at: dineeEvent.starts_at,
            event_status: "upcoming",
            status: "selected",
            selected_at: "2026-09-27T10:00:00.000000Z",
          },
        ],
      });
    }
    throw new Error(`Unexpected request: GET ${url}`);
  });
  vi.stubGlobal("fetch", fetcher);
  mount(<NetworkPage />, "/admin/network");

  await userEvent.click(
    await screen.findByRole("button", {
      name: "Voir l’historique de Sarah Kabeya",
    }),
  );
  expect(await screen.findByText("Historique de Sarah Kabeya")).toBeTruthy();
  expect(await screen.findByText("DINEE Finance")).toBeTruthy();
  expect(screen.getByText("Sélectionné")).toBeTruthy();
});

it("recovers from a network error when the admin retries", async () => {
  let failing = true;
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      if (failing) throw new TypeError("Offline");
      return Response.json({ data: [], meta: emptyMeta });
    }),
  );
  mount(<EventsPage />, "/admin/events");

  expect(
    await screen.findByText("Impossible de charger les données."),
  ).toBeTruthy();
  failing = false;
  await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
  expect(await screen.findByText("Aucune édition")).toBeTruthy();
});
