"use client";

import { useEffect } from "react";

/**
 * After App Hosting rollouts, a tab can keep old JS that references chunk
 * hashes from the previous build → ChunkLoadError. Reload once to pick up
 * the new HTML/asset map.
 */
export function ChunkLoadRecovery() {
  useEffect(() => {
    const key = "chunk-load-reload";

    const reloadOnce = () => {
      try {
        if (sessionStorage.getItem(key) === "1") return;
        sessionStorage.setItem(key, "1");
      } catch {
        // sessionStorage may be unavailable; still attempt a single reload.
      }
      window.location.reload();
    };

    const onError = (event: ErrorEvent) => {
      const msg = String(event.message || "");
      const name = (event.error && (event.error as Error).name) || "";
      if (name === "ChunkLoadError" || /Loading chunk [\w-]+ failed/i.test(msg)) {
        reloadOnce();
      }
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg = String(reason?.message || reason || "");
      const name = String(reason?.name || "");
      if (name === "ChunkLoadError" || /Loading chunk [\w-]+ failed/i.test(msg)) {
        reloadOnce();
      }
    };

    // Clear the guard after a successful load so future deploys can recover too.
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
