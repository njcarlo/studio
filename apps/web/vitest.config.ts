import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// `bug-condition-exploration.test.tsx` is a deliberately-red TDD harness: its
// own header says the tests "MUST FAIL on unfixed code — failure confirms the
// bugs exist. DO NOT fix the code when they fail." Useful to run by hand, but
// it can never gate a pipeline, so `npm run test:ci` skips it via
// VITEST_SKIP_EXPLORATION=true. Plain `npm test` still runs everything.
const EXPLORATION_TESTS = ["**/bug-condition-exploration.test.tsx"];
const skipExploration = process.env.VITEST_SKIP_EXPLORATION === "true";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    exclude: [
      ...configDefaults.exclude,
      // Playwright owns e2e/ — its specs import @playwright/test and cannot run
      // under Vitest. Without this they get collected and fail the unit suite.
      "e2e/**",
      ...(skipExploration ? EXPLORATION_TESTS : []),
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
