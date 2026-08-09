import { test, expect } from "@playwright/test";

/**
 * Unauthenticated public module — TC-PUB-01 / TC-SRM-01 / TC-PAS-01 / TC-C2S-01
 * from the manual happy-path plan.
 *
 * These assert the page renders its own shell (heading + no error boundary),
 * not that specific rows exist, so they stay green against an empty database
 * and are safe to run on any environment.
 *
 * They also guard the deploy fix that made /public/sermons and /public/services
 * `force-dynamic`: both read Postgres per request now, so a 200 here proves the
 * server can render them at runtime rather than only at build time.
 */

/** Nothing user-facing should look like a crashed route. */
async function expectNoAppError(page: import("@playwright/test").Page) {
  await expect(
    page.locator("text=/Application error|Internal Server Error|This page could not be found/i"),
  ).toHaveCount(0);
}

test.describe("Public module (no login)", () => {
  test("TC-SRM-01 — sermons list renders", async ({ page }) => {
    const response = await page.goto("/public/sermons");
    expect(response?.status(), "expected /public/sermons to render").toBeLessThan(400);
    await expect(page.getByRole("heading", { name: /Preaching/i })).toBeVisible();
    await expectNoAppError(page);
  });

  test("TC-PUB-01 — service schedules directory renders", async ({ page }) => {
    const response = await page.goto("/public/services");
    expect(response?.status(), "expected /public/services to render").toBeLessThan(400);
    await expect(page.getByRole("heading", { name: /Service Schedules/i })).toBeVisible();
    await expectNoAppError(page);
  });

  test("TC-PUB-01 — upcoming events page renders", async ({ page }) => {
    const response = await page.goto("/public/events");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { name: /Upcoming Events/i })).toBeVisible();
    await expectNoAppError(page);
  });

  test("TC-PAS-01 — prayer request form is reachable and fillable", async ({ page }) => {
    await page.goto("/public/prayer-requests");
    await expect(page.getByRole("heading", { name: /Prayer/i }).first()).toBeVisible();
    await expectNoAppError(page);

    // The form must actually accept input — a visitor with no account has to be
    // able to type a request. We stop short of submitting so the suite stays
    // side-effect free and can run against any environment.
    const textbox = page.getByRole("textbox").first();
    await expect(textbox).toBeVisible();
    await textbox.fill("E2E smoke check — please ignore.");
    await expect(textbox).toHaveValue("E2E smoke check — please ignore.");
  });

  test("TC-C2S-01 — public C2S join entry point is reachable", async ({ page }) => {
    const response = await page.goto("/public/c2s-join");
    expect(response?.status()).toBeLessThan(400);
    await expectNoAppError(page);
  });
});
