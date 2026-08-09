import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Component tests that import a whole Next route (e.g. the ~1800-line
    // /workers page) spend seconds in module resolution and the first render
    // alone, which blew the 5s default and surfaced as a bogus "bug" failure.
    // The assertions themselves run in milliseconds.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    exclude: [
      ...configDefaults.exclude,
      // Playwright owns e2e/ — its specs import @playwright/test and cannot run
      // under Vitest. Without this they get collected and fail the unit suite.
      "e2e/**",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
