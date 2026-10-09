"use client";

import Link from "next/link";
import { Cookie, ShieldCheck, FileText } from "lucide-react";

interface LandingFooterProps {
  variant?: "default" | "transparent";
}

export function LandingFooter({ variant = "default" }: LandingFooterProps) {
  const openCookiePreferences = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("cog-open-cookie-settings"));
    }
  };

  const isTransparent = variant === "transparent";

  return (
    <footer
      className={`w-full py-8 px-4 sm:px-6 transition-colors ${
        isTransparent
          ? "bg-black/40 backdrop-blur-md border-t border-white/10 text-white/70"
          : "bg-white dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400"
      }`}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        {/* Left: Branding & Church Info */}
        <div className="space-y-0.5">
          <p
            className={`font-semibold text-sm ${
              isTransparent ? "text-white" : "text-slate-800 dark:text-slate-200"
            }`}
          >
            Church of God Dasmariñas
          </p>
          <p className="text-xs">
            © {new Date().getFullYear()} Church Operations & Governance (COG App). All rights reserved.
          </p>
        </div>

        {/* Right: Navigation & Legal Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
          <Link
            href="/"
            className={`transition-colors font-medium ${
              isTransparent ? "hover:text-white" : "hover:text-primary"
            }`}
          >
            Home
          </Link>
          <Link
            href="/about"
            className={`transition-colors font-medium ${
              isTransparent ? "hover:text-white" : "hover:text-primary"
            }`}
          >
            About Us
          </Link>
          <Link
            href="/contact"
            className={`transition-colors font-medium ${
              isTransparent ? "hover:text-white" : "hover:text-primary"
            }`}
          >
            Contact
          </Link>
          <span className={isTransparent ? "text-white/30" : "text-slate-300 dark:text-slate-700"}>
            •
          </span>
          <Link
            href="/terms"
            className={`transition-colors font-medium inline-flex items-center gap-1 ${
              isTransparent ? "hover:text-white" : "hover:text-primary"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className={`transition-colors font-medium inline-flex items-center gap-1 ${
              isTransparent ? "hover:text-white" : "hover:text-primary"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Privacy & Cookies
          </Link>
          <button
            type="button"
            onClick={openCookiePreferences}
            className={`transition-colors font-medium inline-flex items-center gap-1 underline underline-offset-2 ${
              isTransparent
                ? "text-white/80 hover:text-white"
                : "text-slate-500 dark:text-slate-400 hover:text-primary"
            }`}
          >
            <Cookie className="w-3.5 h-3.5" />
            Cookie Settings
          </button>
        </div>
      </div>
    </footer>
  );
}
