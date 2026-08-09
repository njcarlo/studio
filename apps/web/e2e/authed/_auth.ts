import { expect, type Page } from "@playwright/test";

/**
 * Login helper for the authenticated E2E suite.
 *
 * Auth is Firebase Auth, so these specs are meant to run against the Firebase
 * Auth emulator with NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true (see AGENTS.md) and
 * the QA accounts seeded by scripts/seed-qa-accounts-core.ts. They only run when
 * E2E_AUTH=true — see playwright.config.ts.
 *
 * Credentials come from the environment so real ones are never committed;
 * the defaults match the documented QA placeholder super admin
 * (docs/PLACEHOLDER_ACCOUNTS.md).
 */
export const QA_SUPERADMIN = {
  email: process.env.E2E_EMAIL ?? "qa.superadmin@cogdasma.local",
  password: process.env.E2E_PASSWORD ?? "QaSuperAdmin#2026",
};

export async function login(
  page: Page,
  creds: { email: string; password: string } = QA_SUPERADMIN,
): Promise<void> {
  await page.goto("/login");

  // The login form takes an identifier (email or worker ID) plus a password.
  await page.locator("#identifier").fill(creds.email);
  await page.locator("#password").fill(creds.password);
  await page.getByRole("button", { name: /^(log ?in|sign ?in)/i }).click();

  // Landing anywhere other than /login means the session was established.
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
}

/** Fails the test with a clear message if the sidebar module isn't reachable. */
export async function gotoModule(page: Page, path: string): Promise<void> {
  const response = await page.goto(path);
  expect(
    response?.status(),
    `expected ${path} to be reachable for this account`,
  ).toBeLessThan(400);
  await expect(
    page.locator("text=/You do not have permission|Not authenticated/i"),
  ).toHaveCount(0);
}
