const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.DINEE_BASE_URL || "http://127.0.0.1:5173";
const password = process.env.DINEE_DEMO_PASSWORD;
if (!password)
  throw new Error("Set DINEE_DEMO_PASSWORD to the local seeder password.");
const output = path.resolve(__dirname, "../../.local/evidence");
fs.mkdirSync(output, { recursive: true });
(async () => {
  const baseHostname = new URL(base).hostname;
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.DINEE_CHROMIUM_EXECUTABLE || undefined,
    args: baseHostname.endsWith(".test")
      ? [`--host-resolver-rules=MAP ${baseHostname} 127.0.0.1`, "--no-proxy-server"]
      : [],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      locale: "fr-FR",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    async function login(email) {
      await page.goto(base + "/login");
      await page.getByLabel("Adresse e-mail").fill(email);
      await page.getByLabel("Mot de passe", { exact: true }).fill(password);
      await page
        .getByRole("button", { name: "Se connecter", exact: true })
        .click();
    }
    async function noOverflow() {
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        true,
        "Horizontal overflow",
      );
    }
    await login("yannick@dinee.test");
    await page.waitForURL(base + "/admin");
    await page
      .getByText("API et base de données connectées", { exact: true })
      .waitFor();
    await page.reload();
    await page
      .getByText("API et base de données connectées", { exact: true })
      .waitFor();
    await noOverflow();
    await page.screenshot({
      path: path.join(output, "admin-desktop.png"),
      fullPage: true,
    });
    console.log("PASS admin login, API/DB, reload session, desktop");
    const cookies = await context.cookies();
    assert(
      cookies.some(
        (cookie) => cookie.name.endsWith("session") && cookie.httpOnly,
      ),
      "Session must be HttpOnly",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await page.getByRole("link", { name: "Éditions", exact: true }).click();
    await page.waitForURL(base + "/admin/events");
    assert.equal(
      await page
        .getByRole("button", { name: "Menu", exact: true })
        .getAttribute("aria-expanded"),
      "false",
    );
    await noOverflow();
    await page.screenshot({
      path: path.join(output, "admin-mobile.png"),
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Se déconnecter", exact: true })
      .click();
    await page.waitForURL(base + "/login");
    await page.goto(base + "/admin");
    await page.waitForURL(base + "/login");
    console.log("PASS mobile admin navigation, logout, protected route");
    await login("patrick@dinee.test");
    await page.waitForURL(base + "/member");
    await page
      .getByRole("heading", { name: "Bienvenue, Patrick Démo", exact: true })
      .waitFor();
    await noOverflow();
    await page.screenshot({
      path: path.join(output, "member-mobile.png"),
      fullPage: true,
    });
    const current = await context.request.get(base + "/api/v1/auth/user", {
      headers: { Referer: base + "/member", Accept: "application/json" },
    });
    assert.equal(current.status(), 200);
    assert((await current.json()).data.profile_id !== null);
    assert.match(current.headers()["cache-control"], /no-store/);
    const denied = await context.request.get(
      base + "/api/v1/admin/foundation",
      { headers: { Referer: base + "/member", Accept: "application/json" } },
    );
    assert.equal(denied.status(), 403);
    await page.goto(base + "/admin");
    await page.waitForURL(base + "/forbidden");
    await page
      .getByRole("heading", { name: "Accès non autorisé", exact: true })
      .waitFor();
    console.log(
      "PASS member login, linked profile, private headers, admin rejected UI and API",
    );
    await page.goto(base + "/member");
    await page.getByLabel("Langue").selectOption("ar");
    await page.locator('html[dir="rtl"]').waitFor();
    await noOverflow();
    await page.getByLabel("اللغة").selectOption("fr");
    await page
      .getByRole("button", { name: "Se déconnecter", exact: true })
      .click();
    await page.waitForURL(base + "/login");
    const missingCsrf = await context.request.post(
      base + "/api/v1/auth/login",
      {
        data: { email: "patrick@dinee.test", password },
        headers: { Accept: "application/json" },
      },
    );
    assert.equal(missingCsrf.status(), 419);
    await page.goto(base + "/invitation/test-placeholder");
    await page
      .getByRole("heading", { name: "Votre invitation", exact: true })
      .waitFor();
    await noOverflow();
    assert.deepEqual(errors, []);
    console.log(
      "PASS Arabic RTL, logout, real CSRF rejection, public placeholder, no browser errors",
    );
    fs.writeFileSync(
      path.join(output, "smoke-result.json"),
      JSON.stringify(
        {
          passed: true,
          browser: "Chromium headless",
          desktop: "1440x1000",
          mobile: "390x844",
          checkedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
    await context.close();
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
