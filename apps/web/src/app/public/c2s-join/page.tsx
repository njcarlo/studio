"use client";

import { useEffect } from "react";
import { c2sPublicUrl } from "@studio/core-engine/tenant";
import C2SJoinPage from "./C2SJoinPage";

/**
 * Public C2S Group Finder lives at `https://c2s.{rootDomain}`
 * (default `https://c2s.cogdasma.app`).
 *
 * - Production Studio: always redirects to that module host.
 * - Keep in-Studio UI: `NEXT_PUBLIC_C2S_EMBEDDED=true`
 * - Local c2s-public: `NEXT_PUBLIC_MODULE_URL_C2S=http://localhost:9004`
 */
export default function PublicC2SJoinEntry() {
  const embedded = process.env.NEXT_PUBLIC_C2S_EMBEDDED === "true";
  const target = c2sPublicUrl();

  useEffect(() => {
    if (embedded) return;
    try {
      const url = new URL(target);
      if (window.location.host !== url.host) {
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
