import nextConfig from "eslint-config-next";
import coreWebVitals from "eslint-config-next/core-web-vitals";

export default [
  ...nextConfig,
  ...coreWebVitals,
  {
    rules: {
      // Cosmetic — escapable apostrophes/quotes; fix over time, don't block CI
      "react/no-unescaped-entities": "warn",

      // React Compiler enforcement rules — new rules flagging existing code patterns.
      // Downgraded to warn until the codebase is migrated to React Compiler idioms.
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/static-components": "warn",

      // Missing deps — warn so existing code isn't blocked; fix forward
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
