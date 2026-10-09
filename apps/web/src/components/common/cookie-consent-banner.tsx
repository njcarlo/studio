"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, Check, Settings2, X, Sparkles, Smartphone } from "lucide-react";
import { Button } from "@studio/ui";

const CONSENT_KEY = "cog_cookie_consent";

export function CookieConsentBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(CONSENT_KEY);
      if (!consent) {
        const timer = setTimeout(() => setIsOpen(true), 1000);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const handleReopen = () => {
      setShowDetails(true);
      setIsOpen(true);
    };
    window.addEventListener("cog-open-cookie-settings", handleReopen);
    return () => window.removeEventListener("cog-open-cookie-settings", handleReopen);
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({
          version: "1.0",
          type: "all",
          essential: true,
          functional: true,
          analytics: true,
          date: new Date().toISOString(),
        })
      );
    } catch {}
    setIsOpen(false);
  };

  const handleAcceptEssential = () => {
    try {
      localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({
          version: "1.0",
          type: "essential",
          essential: true,
          functional: false,
          analytics: false,
          date: new Date().toISOString(),
        })
      );
    } catch {}
    setIsOpen(false);
  };

  const handleDismiss = () => {
    // When user dismisses via [X], treat as Essential Only so optional tracking is not assumed without consent
    try {
      localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({
          version: "1.0",
          type: "essential",
          essential: true,
          functional: false,
          analytics: false,
          date: new Date().toISOString(),
        })
      );
    } catch {}
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      role="region"
      aria-label="Privacy and Cookie Consent"
      className="fixed bottom-3 inset-x-3 sm:bottom-6 sm:inset-x-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="rounded-2xl p-4 sm:p-5 shadow-[0_12px_40px_0_rgba(0,0,0,0.8)] backdrop-blur-2xl bg-black/80 border border-white/20 text-white ring-1 ring-white/10">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 shrink-0">
            <Cookie className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-1.5">
                Privacy & Cookies
              </h3>
              <button
                onClick={handleDismiss}
                aria-label="Close notice"
                className="text-white/60 hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="mt-1.5 text-xs text-white/80 leading-relaxed">
              We use small, essential storage on your device to keep you securely signed in, remember your light/dark mode, and protect your devotions. <strong>We do not use advertising or tracking cookies.</strong>
            </p>

            <div className="mt-1.5 text-[11px] text-white/60">
              Read our{" "}
              <Link
                href="/privacy"
                className="text-blue-300 font-medium underline underline-offset-2 hover:text-white"
              >
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link
                href="/terms"
                className="text-blue-300 font-medium underline underline-offset-2 hover:text-white"
              >
                Terms of Service
              </Link>
              .
            </div>

            {showDetails && (
              <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-2.5">
                <div className="flex items-start gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">
                      Stay Signed In & Display Settings:
                    </span>
                    <p className="text-white/70 text-[11px]">
                      Saves your secure login session, theme (light/dark), and font size preference.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">
                      Offline Devotions Drafts:
                    </span>
                    <p className="text-white/70 text-[11px]">
                      Backs up your daily reflections so they are not lost if your internet connection drops.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                onClick={handleAcceptAll}
                size="sm"
                className="text-xs font-semibold rounded-lg bg-primary hover:bg-primary/90 text-white shadow-sm flex-1 sm:flex-initial"
              >
                Accept All
              </Button>

              <Button
                onClick={handleAcceptEssential}
                variant="outline"
                size="sm"
                className="text-xs font-medium rounded-lg border-white/20 bg-white/10 text-white hover:bg-white/20 flex-1 sm:flex-initial"
              >
                Essential Only
              </Button>

              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white font-medium px-1.5 py-1 transition-colors ml-auto"
              >
                <Settings2 className="w-3.5 h-3.5" />
                {showDetails ? "Hide Details" : "Details"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
