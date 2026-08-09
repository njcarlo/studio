import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests for the happy paths in the manual QA plan.
 *
 * Two suites, split by what they need to run:
 *
 * - `public`  — the unauthenticated /public/* pages. Needs only the app + a
 *               reachable DATABASE_URL, so it runs anywhere (including CI).
 * - `authed`  — the staff modules. Needs Firebase Auth, which in a test
 *               environment means the Firebase Auth emulator
 *               (NEXT_PUBLIC_FIREBASE_USE_EMULATOR=true — see AGENTS.md).
 *               Skipped unless E2E_AUTH=true so a missing emulator can never
 *               turn the pipeline red.
 *
 * Chromium is pre-installed in the container image (PLAYWRIGHT_BROWSERS_PATH),
 * so never run `playwright install` here. The image's browser build can differ
 * from the revision this @playwright/test version expects, which fails with
 * "Executable doesn't exist at .../chromium_headless_shell-<rev>". Set
 * E2E_CHROMIUM_PATH to the on-disk binary (e.g.
 * /opt/pw-browsers/chromium-1194/chrome-linux/chrome) to launch it directly.
 */
const PORT = Number(process.env.E2E_PORT ?? 9002);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const AUTH_ENABLED = process.env.E2E_AUTH === "true";
const CHROMIUM_PATH = process.env.E2E_CHROMIUM_PATH;
const chromium = {
  ...devices["Desktop Chrome"],
  ...(CHROMIUM_PATH ? { launchOptions: { executablePath: CHROMIUM_PATH } } : {}),
};

export default defineConfig({
  testDir: "./e2e",
  // Each spec drives a multi-step user flow; give them room without hanging CI.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "en-US",
  },

  projects: [
    {
      name: "public",
      testMatch: /public\/.*\.spec\.ts/,
      use: chromium,
    },
    ...(AUTH_ENABLED
      ? [
          {
            name: "authed",
            testMatch: /authed\/.*\.spec\.ts/,
            use: chromium,
          },
        ]
      : []),
  ],

  // Reuse an already-running dev server locally; boot one in CI.
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: `npx next start -p ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
