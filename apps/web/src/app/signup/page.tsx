"use client";

import Image from "next/image";
import Link from "next/link";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingFooter } from "@/components/landing/landing-footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from "@studio/ui";
import { ShieldCheck, UserCheck, ArrowRight, MessageSquare } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between text-white selection:bg-primary selection:text-white">
      {/* Background Image matching Login Page */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/cog-bg.png"
          alt="Background"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
        <div className="absolute inset-0 shadow-[inset_0_0_140px_70px_rgba(0,0,0,0.7)]" />
      </div>

      {/* Floating Capsule Header */}
      <LandingNav currentPath="/signup" />

      {/* Centered Registration Card */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center flex-1 px-4 py-28">
        <Card className="w-full max-w-[480px] shadow-[0_8px_32px_0_rgba(0,0,0,0.8)] backdrop-blur-xl bg-black/40 border border-white/20 text-white rounded-2xl animate-in fade-in zoom-in-95 duration-500">
          <CardHeader className="space-y-3 text-center pt-8 pb-4 px-6 sm:px-8">
            <div className="flex justify-center items-center">
              <div className="p-3 rounded-2xl bg-primary/20 border border-primary/40 text-blue-300">
                <UserCheck className="w-8 h-8" />
              </div>
            </div>
            <CardTitle className="font-headline text-2xl text-white">
              Worker Account Registration
            </CardTitle>
            <CardDescription className="text-white/80 text-sm leading-relaxed">
              Welcome to the Church Operations and Governance Application (COG App) of Church of God Dasmariñas.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 sm:px-8 pb-8 space-y-5">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs sm:text-sm text-white/85 leading-relaxed">
              <p className="font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                Church Governance & Privacy Protected
              </p>
              <p className="text-white/75 text-xs">
                To safeguard church records and ensure active ministry oversight, new worker and volunteer accounts are registered and approved by designated <strong>Ministry Heads</strong> and <strong>Administrators</strong>.
              </p>
            </div>

            <div className="space-y-2.5">
              <Link href="/login" className="w-full block">
                <Button className="w-full h-11 font-semibold text-sm bg-primary hover:bg-primary/90 text-white gap-2 shadow-sm">
                  Proceed to Login <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              <Link href="/contact" className="w-full block">
                <Button variant="outline" className="w-full h-11 font-medium text-sm border-white/20 bg-white/10 text-white hover:bg-white/20 gap-2">
                  <MessageSquare className="w-4 h-4" /> Contact Church Administration
                </Button>
              </Link>
            </div>

            {/* Terms and Privacy Reference */}
            <p className="text-[11px] text-center text-white/60 leading-relaxed pt-2 border-t border-white/10">
              By accessing your worker account, you adhere to the Church of God Dasmariñas{" "}
              <Link href="/terms" className="text-blue-300 underline hover:text-white font-medium">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-blue-300 underline hover:text-white font-medium">
                Privacy Policy
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transparent Footer */}
      <LandingFooter variant="transparent" />
    </div>
  );
}
