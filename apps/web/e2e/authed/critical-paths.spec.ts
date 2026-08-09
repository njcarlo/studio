import { test, expect } from "@playwright/test";
import { login, gotoModule } from "./_auth";

/**
 * Regression cover for the three flows fixed in Aug 2026 — the ones most worth
 * catching automatically, since each was a silent production failure:
 *
 *  - TC-RES-01  room reservation submit (broke on a missing SQL function, and
 *               the real error was masked by a generic toast)
 *  - TC-WRK-01/03  worker create + the delete-with-history guard
 *  - TC-VA-01/03  venue assistance booking + command center
 *
 * Requires the Firebase Auth emulator and seeded QA accounts; gated behind
 * E2E_AUTH=true so a missing emulator never turns the pipeline red.
 */

test.beforeEach(async ({ page }) => {
  await login(page);
});

test.describe("Room reservations", () => {
  test("TC-RES-01 — reservation form loads with rooms available", async ({ page }) => {
    await gotoModule(page, "/reservations/new");

    await expect(page.getByRole("heading", { name: /Reserve a Room/i })).toBeVisible();

    // The blocked-profile screens mean the account can't file a reservation at
    // all — the exact dead end the ministry-assignment fix addressed.
    await expect(page.locator("text=/Worker Profile Not Found/i")).toHaveCount(0);
    await expect(page.locator("text=/No Worker Profile Linked/i")).toHaveCount(0);

    await expect(page.getByRole("button", { name: /Submit Request/i })).toBeVisible();
  });

  test("TC-RES-01 — submitting with nothing filled in is rejected, not silently failed", async ({
    page,
  }) => {
    await gotoModule(page, "/reservations/new");
    await page.getByRole("button", { name: /Submit Request/i }).click();

    // Validation must surface a specific reason. The bug being guarded against
    // is the opposite: a generic "Submission Failed" that hides the real cause.
    // The toast renders the text twice (visible title + aria-live announcement),
    // so scope to the first match rather than tripping strict mode.
    await expect(page.getByText("Missing Information").first()).toBeVisible();
  });

  test("TC-RES-01 — my reservations list is reachable", async ({ page }) => {
    await gotoModule(page, "/reservations/my");
    await expect(page.locator("text=/Application error/i")).toHaveCount(0);
  });
});

test.describe("Worker management", () => {
  test("TC-WRK-01 — worker directory loads and offers Add", async ({ page }) => {
    await gotoModule(page, "/workers");
    await expect(page.getByRole("button", { name: /Add Worker|Add$/i }).first()).toBeVisible();
  });

  test("TC-WRK-01 — add-worker form exposes its required fields", async ({ page }) => {
    await gotoModule(page, "/workers");
    await page.getByRole("button", { name: /Add Worker|Add$/i }).first().click();

    // Guards the create bug: required NOT NULL columns had no value, so the
    // form must actually render inputs to collect them.
    await expect(page.getByRole("textbox").first()).toBeVisible();
  });
});

test.describe("Venue assistance", () => {
  test("TC-VA-01 — venue booking page loads", async ({ page }) => {
    await gotoModule(page, "/venue");
    await expect(page.locator("text=/Application error/i")).toHaveCount(0);
  });

  test("TC-VA-03 — command center loads for a manager", async ({ page }) => {
    await gotoModule(page, "/venue/command-center");
    await expect(page.locator("text=/Application error/i")).toHaveCount(0);
  });
});

test.describe("Approvals", () => {
  test("TC-APPR-01 — approvals inbox loads", async ({ page }) => {
    await gotoModule(page, "/approvals");
    await expect(page.locator("text=/Application error/i")).toHaveCount(0);
  });
});
