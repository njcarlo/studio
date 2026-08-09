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

  // Login is a two-step form: enter the identifier (email or worker ID) and
  // press Continue, which looks the account up and only then reveals the
  // password field. Filling both at once fails — #password does not exist yet.
  await page.locator("#identifier").fill(creds.email);
  await page.getByRole("button", { name: /continue/i }).click();

  const password = page.locator("#password");
  await expect(password, "password step should appear after Continue").toBeVisible({
    timeout: 30_000,
  });
  await password.fill(creds.password);
  await page.getByRole("button", { name: /^(log ?in|sign ?in|submit)/i }).click();

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
