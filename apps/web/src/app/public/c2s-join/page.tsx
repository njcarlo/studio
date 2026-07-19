"use client";

import { useEffect } from "react";
import { c2sPublicUrl } from "@studio/core-engine/tenant";
import C2SJoinPage from "./C2SJoinPage";

/**
 * Public C2S Group Finder.
 *
 * Default (custom DNS deferred): render the finder in Studio at this path.
 * When a dedicated `apps/c2s-public` host is configured via
 * `NEXT_PUBLIC_MODULE_URL_C2S` / `NEXT_PUBLIC_C2S_PUBLIC_URL` and
 * `NEXT_PUBLIC_C2S_EMBEDDED` is not `"true"`, redirect to that host.
 *
 * - Force embed: `NEXT_PUBLIC_C2S_EMBEDDED=true`
 * - Force redirect to module URL: set MODULE_URL / C2S_PUBLIC_URL and
 *   `NEXT_PUBLIC_C2S_EMBEDDED=false`
 * - Local standalone: `NEXT_PUBLIC_MODULE_URL_C2S=http://localhost:9004`
 *   with `NEXT_PUBLIC_C2S_EMBEDDED=false`
 */
function shouldEmbedC2S(): boolean {
  if (process.env.NEXT_PUBLIC_C2S_EMBEDDED === "true") return true;
  if (process.env.NEXT_PUBLIC_C2S_EMBEDDED === "false") return false;

  const override =
    process.env.NEXT_PUBLIC_MODULE_URL_C2S ||
    process.env.NEXT_PUBLIC_C2S_PUBLIC_URL;
  // No dedicated public host → stay in Studio (avoid dead c2s.cogdasma.app).
  if (!override) return true;

  // Override points at this Studio route → render here (no redirect loop).
  try {
    const path = new URL(override).pathname.replace(/\/$/, "");
    if (path === "/public/c2s-join") return true;
  } catch {
    /* ignore */
  }

  return false;
}

export default function PublicC2SJoinEntry() {
  const embedded = shouldEmbedC2S();
  const target = c2sPublicUrl();

  useEffect(() => {
    if (embedded) return;
    try {
      const url = new URL(target);
      if (window.location.href.replace(/\/$/, "") === url.toString().replace(/\/$/, "")) {
        return;
      }
      if (window.location.host !== url.host || window.location.pathname !== url.pathname) {
        window.location.replace(url.toString());
      }
    } catch {
      /* ignore bad URL */
    }
  }, [embedded, target]);

  if (embedded) {
    return <C2SJoinPage />;
  }

  let host = target;
  try {
    host = new URL(target).host;
  } catch {
    /* keep raw */
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-2 text-muted-foreground">
      <p>Redirecting to C2S Group Finder…</p>
      <a className="text-sm text-brand hover:underline" href={target}>
        {host}
      </a>
    </div>
  );
}
