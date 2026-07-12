"use client";

import { useEffect } from "react";
import C2SJoinPage from "./C2SJoinPage";

/**
 * If NEXT_PUBLIC_C2S_PUBLIC_URL is set, send visitors to the standalone
 * c2s-public app. Otherwise render the in-Studio Group Finder.
 */
export default function PublicC2SJoinEntry() {
  const external = process.env.NEXT_PUBLIC_C2S_PUBLIC_URL;

  useEffect(() => {
    if (external) {
      window.location.replace(external);
    }
  }, [external]);

  if (external) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Redirecting to C2S Group Finder…
      </div>
    );
  }

  return <C2SJoinPage />;
}
