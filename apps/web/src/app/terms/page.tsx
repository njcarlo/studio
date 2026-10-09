"use client";

import Image from "next/image";
import Link from "next/link";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import {
  Scale,
  Church,
  UserCheck,
  ShieldAlert,
  CalendarCheck,
  HeartHandshake,
  Lock,
  Sparkles,
} from "lucide-react";

export default function TermsPage() {
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
      <LandingNav currentPath="/terms" />

      {/* Centered Main Content Wrapper */}
      <div className="relative z-10 w-full flex flex-col items-center pt-24 sm:pt-28 pb-16 px-4 sm:px-6">
        <div className="w-full max-w-3xl flex flex-col items-center space-y-6">
          {/* Header Title Section */}
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-md">
              <Scale className="w-4 h-4" />
              <span>Simple Guidelines for Everyone</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
              Terms of Service
            </h1>

            <p className="text-sm sm:text-base text-white/80 leading-relaxed">
              These simple guidelines help ensure that our church community stays safe, honest, and organized while using the COG App.
            </p>

            <p className="text-xs text-white/50">
              Last Updated: October 2026 • Version 1.0
            </p>
          </div>

          {/* Card 1: What is the COG App for? */}
          <section className="w-full rounded-2xl p-6 sm:p-8 backdrop-blur-xl bg-black/40 border border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 shrink-0">
                <Church className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                1. What the App is For
              </h2>
            </div>

            <p className="text-sm sm:text-base text-white/85 leading-relaxed">
              The <strong>COG App</strong> is created exclusively to support the ministry of <strong>Church of God Dasmariñas</strong>. It helps all of us:
            </p>

            <ul className="space-y-2 text-xs sm:text-sm text-white/80">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2" />
                <span>Check in attendance easily for Sunday worship and ministry gatherings via QR scan.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2" />
                <span>Reserve church rooms and borrow audio-visual equipment for ministry rehearsals.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2" />
                <span>Organize volunteer meal stubs and event schedules smoothly.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-2" />
                <span>Share daily devotions and reflections (C2S Devotions) with your team.</span>
              </li>
            </ul>
          </section>

          {/* Card 2: Worker & Member Responsibilities */}
          <section className="w-full rounded-2xl p-6 sm:p-8 backdrop-blur-xl bg-black/40 border border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                2. Your Responsibilities as a User
              </h2>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm text-white/85 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Keep Your Password Safe</span>
                </div>
                <p className="text-white/75">
                  Do not share your Worker ID, password, or Google login with others. If you suspect someone knows your password, change it immediately or ask the church office for a reset.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <HeartHandshake className="w-4 h-4 text-blue-400" />
                  <span>Christian Conduct & Respect</span>
                </div>
                <p className="text-white/75">
                  Treat every church member, leader, and volunteer with respect and kindness in all notes, forms, and requests submitted through this app.
                </p>
              </div>
            </div>
          </section>

          {/* Card 3: What is Strictly Not Allowed */}
          <section className="w-full rounded-2xl p-6 sm:p-8 backdrop-blur-xl bg-black/40 border border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                3. Things You Must Not Do
              </h2>
            </div>

            <p className="text-sm text-white/85 leading-relaxed">
              To keep the system trustworthy and fair to all workers, please avoid the following:
            </p>

            <ul className="space-y-2 text-xs sm:text-sm text-white/80">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-2" />
                <span><strong>No Fake Attendance:</strong> Do not scan QR codes for people who are not actually present or use cloned codes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-2" />
                <span><strong>No Commercial Spam:</strong> Never use member lists, phone numbers, or emails to promote personal business or unsolicited selling.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-2" />
                <span><strong>No Tampering:</strong> Do not attempt to modify, hack, or disrupt the church database.</span>
              </li>
            </ul>
          </section>

          {/* Card 4: Facilities & Equipment Care */}
          <section className="w-full rounded-2xl p-6 sm:p-8 backdrop-blur-xl bg-black/40 border border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300 shrink-0">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                4. Taking Care of Church Facilities
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
              When requesting rooms or borrowing church instruments and equipment, please care for them as God's property. Always return items on time, keep rooms clean, and notify ministry administrators immediately if something requires maintenance.
            </p>
          </section>

          {/* Card 5: Need Assistance */}
          <section className="w-full rounded-2xl p-6 backdrop-blur-xl bg-black/30 border border-white/10 text-center space-y-2.5">
            <h3 className="font-bold text-base sm:text-lg text-white">
              Need Help with Your Account?
            </h3>
            <p className="text-xs sm:text-sm text-white/75 max-w-lg mx-auto">
              If you have any questions or need your Worker ID or password updated, please talk to your Ministry Head or message us through our{" "}
              <Link href="/contact" className="text-blue-400 underline underline-offset-2 hover:text-blue-300 font-semibold">
                Contact Page
              </Link>
              .
            </p>
          </section>
        </div>
      </div>

      {/* Transparent Glass Footer */}
      <LandingFooter variant="transparent" />
    </div>
  );
}
