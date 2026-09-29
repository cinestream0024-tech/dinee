import { afterEach, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { AppWrapper } from "../src/components/common/PageMeta";
import { LanguageProvider } from "../src/context/LanguageContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import MemberLayout from "../src/layouts/MemberLayout";
import "../src/i18n";

const member = {
  id: 2,
  name: "Patrick Démo",
  email: "patrick@dinee.test",
  role: "member",
  profile_id: 3,
};

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

function mount(path = "/member") {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json({ data: member })),
  );
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
                <Route path="/member" element={<MemberLayout />}>
                  <Route index element={<div>Accueil membre</div>} />
                  <Route path="profile" element={<div>Profil membre</div>} />
                  <Route
                    path="profile/edit"
                    element={<div>Édition profil</div>}
                  />
                  <Route
                    path="invitations"
                    element={<div>Invitations membre</div>}
                  />
                </Route>
              </Routes>
            </MemoryRouter>
          </AppWrapper>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

it("provides the three familiar member destinations on mobile and desktop", () => {
  mount("/member/profile");

  const navigation = screen.getAllByRole("navigation", {
    name: "Navigation membre",
  });
  expect(navigation).toHaveLength(2);
  expect(navigation[0].closest("header")).not.toBeNull();
  expect(navigation[1].closest("header")).toBeNull();
  expect(navigation[1].className).toContain("bottom-0");
  expect(screen.getAllByRole("link", { name: "Mon espace" })).toHaveLength(2);
  expect(screen.getAllByRole("link", { name: "Mes invitations" })).toHaveLength(
    2,
  );
  const profileLinks = screen.getAllByRole("link", { name: "Mon profil" });
  expect(profileLinks).toHaveLength(2);
  expect(
    profileLinks.every((link) => link.getAttribute("aria-current") === "page"),
  ).toBe(true);
});

it("keeps the light and dark mode control accessible", async () => {
  mount();

  await userEvent.click(
    screen.getByRole("button", { name: "Changer le thème" }),
  );

  await waitFor(() =>
    expect(document.documentElement.classList.contains("dark")).toBe(true),
  );
  expect(localStorage.getItem("theme")).toBe("dark");
});
it("removes member navigation while editing the profile", () => {
  mount("/member/profile/edit");

  expect(screen.getByText("Édition profil")).toBeTruthy();
  expect(
    screen.queryByRole("navigation", { name: "Navigation membre" }),
  ).toBeNull();
});
