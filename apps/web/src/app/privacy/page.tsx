"use client";

import Image from "next/image";
import Link from "next/link";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import {
  ShieldCheck,
  Cookie,
  Lock,
  HeartHandshake,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Smartphone,
  EyeOff,
  UserCheck,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { Button } from "@studio/ui";

export default function PrivacyPage() {
  const handleOpenCookieSettings = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("cog-open-cookie-settings"));
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between text-white selection:bg-primary selection:text-white">
      {/* Background Image matching Login Page */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/cog-bg.png"
          alt="Church Background"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Dark overlay for high contrast and readability */}
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
        {/* Soft vignette around edges */}
        <div className="absolute inset-0 shadow-[inset_0_0_140px_70px_rgba(0,0,0,0.7)]" />
      </div>

      {/* Floating Header */}
      <LandingNav currentPath="/privacy" />

      {/* Centered Main Content Wrapper */}
      <div className="relative z-10 w-full flex flex-col items-center pt-24 sm:pt-28 pb-16 px-4 sm:px-6">
        <div className="w-full max-w-3xl flex flex-col items-center space-y-6">
          {/* Header Title Section */}
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
              <ShieldCheck className="w-4 h-4" />
              <span>Data Privacy Act of 2012 (RA 10173) Protected</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
              Privacy & Cookies Policy
            </h1>

            <p className="text-sm sm:text-base text-white/80 leading-relaxed">
              We believe in honesty and transparency. Here is a simple, easy-to-understand explanation of how your information and device storage are used in the COG App.
            </p>

            <p className="text-xs text-white/50">
              Last Updated: October 2026 • Version 1.0
            </p>
          </div>

          {/* Card 1: Our Simple Promise */}
          <section className="w-full rounded-2xl p-6 sm:p-8 backdrop-blur-xl bg-black/40 border border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 shrink-0">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                1. Our Promise to You: Zero Ads, Zero Selling
              </h2>
            </div>

            <p className="text-sm sm:text-base text-white/85 leading-relaxed">
              The <strong>Church of God Dasmariñas</strong> treats your personal details with the utmost Christian care and confidentiality.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white/90">
                <EyeOff className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>No Advertisements:</strong> We never track you to show ads or sell products.</span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white/90">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>No Sharing:</strong> Your email and phone number are never shared with outside marketing companies.</span>
              </div>
            </div>
          </section>

          {/* Card 2: Cookies & Phone/Computer Storage in Plain English */}
          <section className="w-full rounded-2xl p-6 sm:p-8 backdrop-blur-xl bg-black/40 border border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 shrink-0">
                  <Cookie className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    2. Cookies & Storage (Explained for Non-Techies)
                  </h2>
                  <p className="text-xs text-white/60">
                    What we save on your browser and why it helps you
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenCookieSettings}
                className="text-xs gap-1.5 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Cookie Settings
              </Button>
            </div>

            <p className="text-sm text-white/85 leading-relaxed">
              Like most apps, we temporarily store a few small pieces of text on your phone or computer so the app runs smoothly for you:
            </p>

            {/* Plain English Items */}
            <div className="space-y-3">
              {/* Item 1 */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <span>Keeping You Signed In (Login Session)</span>
                </div>
                <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
                  When you log in with your Worker ID or Google, your browser securely remembers who you are. This means you do not have to type your password again every time you tap on a new page.
                </p>
              </div>

              {/* Item 2 */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Your Display Choices (Dark Mode & Font Size)</span>
                </div>
                <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
                  If you switch between Light or Dark Mode, or adjust the text size to make it easier to read, we remember your preference so the app always looks just the way you like it.
                </p>
              </div>

              {/* Item 3 */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>Daily Devotions Offline Backup (C2S Devotions)</span>
                </div>
                <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
                  While you write your devotion reflections, the app saves a quick backup on your device. If your mobile data or Wi-Fi drops, your writing won't be lost!
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70 flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-white/60 shrink-0 mt-0.5" />
              <span>
                <strong>Want to clear this data?</strong> Simply log out of the app, or clear your browser's history under <em>Clear Browsing Data</em>.
              </span>
            </div>
          </section>

          {/* Card 3: What Church Information is Kept */}
          <section className="w-full rounded-2xl p-6 sm:p-8 backdrop-blur-xl bg-black/40 border border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                3. What Information We Keep and Why
              </h2>
            </div>

            <p className="text-sm text-white/85 leading-relaxed">
              We only ask for information needed to run church ministries effectively:
            </p>

            <ul className="space-y-2.5 text-xs sm:text-sm text-white/80">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2" />
                <span><strong>Your Profile:</strong> Name, Worker ID, phone number, and ministry assignment so leaders know how to reach you.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2" />
                <span><strong>Attendance Logs:</strong> Date and time when your QR code is scanned for Sunday services and church events.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2" />
                <span><strong>Venue & Equipment Requests:</strong> Records of rooms or instruments borrowed so events do not conflict.</span>
              </li>
            </ul>
          </section>

          {/* Card 4: Your Rights */}
          <section className="w-full rounded-2xl p-6 sm:p-8 backdrop-blur-xl bg-black/40 border border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                4. Your Rights as a Member or Worker
              </h2>
            </div>

            <p className="text-sm text-white/85 leading-relaxed">
              You are in control of your data. Under the Philippine Data Privacy Act:
            </p>

            <ul className="space-y-2 text-xs sm:text-sm text-white/80">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>You can review or correct your profile details anytime.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>You can ask questions about how your church records are stored.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>You can request account deactivation if you are no longer serving in the ministry.</span>
              </li>
            </ul>
          </section>

          {/* Card 5: Need Assistance */}
          <section className="w-full rounded-2xl p-6 backdrop-blur-xl bg-black/30 border border-white/10 text-center space-y-2.5">
            <h3 className="font-bold text-base sm:text-lg text-white">
              Questions or Need Help?
            </h3>
            <p className="text-xs sm:text-sm text-white/75 max-w-lg mx-auto">
              If anything is unclear, feel free to visit the Church Secretariat office or send a note through our{" "}
              <Link href="/contact" className="text-blue-400 underline underline-offset-2 hover:text-blue-300 font-semibold">
                Contact Page
              </Link>
              . We are always glad to assist you!
            </p>
          </section>
        </div>
      </div>

      {/* Transparent Glass Footer */}
      <LandingFooter variant="transparent" />
    </div>
  );
}
