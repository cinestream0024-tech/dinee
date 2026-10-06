import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { AppWrapper } from "../src/components/common/PageMeta";
import { LanguageProvider } from "../src/context/LanguageContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import { sessionKey } from "../src/features/auth/auth";
import MemberHomePage from "../src/pages/member/MemberHomePage";
import i18n from "../src/i18n";

beforeEach(async () => {
  localStorage.setItem("i18nextLng", "fr");
  await i18n.changeLanguage("fr");
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

it("prioritizes the active invitation and summarizes the member relationship", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/v1/member/invitations"))
        return Response.json({
          data: [
            {
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
                description: null,
                status: "upcoming",
              },
            },
          ],
        });
      if (url.endsWith("/api/v1/member/profile"))
        return Response.json({ data: { availability: "available" } });
      if (url.endsWith("/api/v1/member/history"))
        return Response.json({
          data: [
            {
              event_id: 3,
              event_title: "DINEE Leadership",
              starts_at: "2026-08-12T18:00:00.000Z",
              status: "present",
              selected_at: "2026-07-01T10:00:00.000Z",
            },
          ],
        });
      return new Response("{}", { status: 404 });
    }),
  );
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  client.setQueryData(sessionKey, {
    id: 2,
    name: "Patrick Démo",
    email: "patrick@dinee.test",
    role: "member",
    profile_id: 3,
  });

  render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <LanguageProvider>
          <AppWrapper>
            <MemoryRouter>
              <MemberHomePage />
            </MemoryRouter>
          </AppWrapper>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );

  expect(screen.getByRole("heading", { name: "Bonjour, Patrick" })).toBeTruthy();
  expect(await screen.findByText("DINEE Finance")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Répondre à l’invitation" })).toBeTruthy();
  expect(await screen.findByText("Disponible")).toBeTruthy();
  expect(await screen.findByText("DINEE Leadership")).toBeTruthy();
});
