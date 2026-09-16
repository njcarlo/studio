"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Button,
  Input,
  Label,
} from "@studio/ui";
import {
  Smartphone,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@studio/store";
import { supabase } from "@studio/database";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function MySettingsPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState("password");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!user?.email) return;
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your inbox to reset your password.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send password reset email.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      await supabase.auth.signOut({ scope: "global" });
      toast({
        title: "Logged out from all devices",
        description: "You have been logged out from all devices.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to logout from all devices.",
      });
    }
  };

  return (
    <AppLayout>
      <div className="w-full pb-12">
        {/* Header Section - Desktop only */}
        <div className="space-y-1 mb-6 hidden md:block">
          <h1 className="text-3xl font-bold font-headline text-foreground">
            My Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Fixed Tab Header - Mobile (above content) */}
        <div className="md:hidden fixed top-14 left-0 right-0 z-40 bg-sidebar px-3 py-2.5 border-b border-sidebar-border/40 shadow-sm">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("password")}
              className={cn(
                "px-2.5 py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center",
                activeTab === "password"
                  ? "bg-white dark:bg-card text-sidebar shadow-xs"
                  : "text-white/70 hover:text-white bg-white/5"
              )}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("support")}
              className={cn(
                "px-2.5 py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center",
                activeTab === "support"
                  ? "bg-white dark:bg-card text-sidebar shadow-xs"
                  : "text-white/70 hover:text-white bg-white/5"
              )}
            >
              Help & Support
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("report")}
              className={cn(
                "px-2.5 py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center",
                activeTab === "report"
                  ? "bg-white dark:bg-card text-sidebar shadow-xs"
                  : "text-white/70 hover:text-white bg-white/5"
              )}
            >
              Report Problem
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={cn(
                "px-2.5 py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center",
                activeTab === "security"
                  ? "bg-white dark:bg-card text-sidebar shadow-xs"
                  : "text-white/70 hover:text-white bg-white/5"
              )}
            >
              Security
            </button>
          </div>
        </div>

        {/* Spacer for mobile fixed header */}
        <div className="md:hidden h-[72px]" />

        {/* Main Card Container */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark overflow-hidden">
          {/* Desktop Tab Header - Inside Card */}
          <div className="hidden md:block p-5 border-b border-border/60 bg-sidebar">
            <div className="bg-slate-100/20 dark:bg-black/20 p-1 rounded-xl flex items-center border border-white/10 shadow-2xs overflow-x-auto gap-1 scrollbar-hide">
              <button
                type="button"
                onClick={() => setActiveTab("password")}
                className={cn(
                  "px-3.5 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex-shrink-0",
                  activeTab === "password"
                    ? "bg-white dark:bg-card text-sidebar shadow-xs"
                    : "text-white/70 hover:text-white dark:text-white/60 dark:hover:text-white"
                )}
              >
                Change Password
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("support")}
                className={cn(
                  "px-3.5 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex-shrink-0",
                  activeTab === "support"
                    ? "bg-white dark:bg-card text-sidebar shadow-xs"
                    : "text-white/70 hover:text-white dark:text-white/60 dark:hover:text-white"
                )}
              >
                Help & Support
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("report")}
                className={cn(
                  "px-3.5 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex-shrink-0",
                  activeTab === "report"
                    ? "bg-white dark:bg-card text-sidebar shadow-xs"
                    : "text-white/70 hover:text-white dark:text-white/60 dark:hover:text-white"
                )}
              >
                Report a Problem
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("security")}
                className={cn(
                  "px-3.5 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex-shrink-0",
                  activeTab === "security"
                    ? "bg-white dark:bg-card text-sidebar shadow-xs"
                    : "text-white/70 hover:text-white dark:text-white/60 dark:hover:text-white"
                )}
              >
                Login Security
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-5 sm:p-6 md:p-8">
            {activeTab === "password" && (
              <div className="space-y-4 sm:space-y-5 max-w-2xl mx-auto">
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold font-headline text-foreground">Change Password</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Update your account password. We'll send a reset link to your email.
                  </p>
                </div>
                
                <div className="bg-background rounded-xl border border-border/60 p-4 sm:p-5 shadow-sm space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs sm:text-sm font-semibold text-foreground">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted text-sm font-medium h-10 rounded-xl border-border/60"
                    />
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    className="w-full text-sm font-semibold h-10 rounded-xl bg-sidebar hover:bg-sidebar/90 text-white shadow-xs"
                  >
                    {isChangingPassword ? "Sending..." : "Send Password Reset Email"}
                  </Button>
                </div>

                <div className="bg-blue-50/60 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200/70 dark:border-blue-900/40">
                  <p className="text-xs text-blue-900 dark:text-blue-300 leading-relaxed">
                    <span className="font-bold">Note:</span> You'll receive an email with instructions to reset your password. The link will expire in 1 hour.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-4 sm:space-y-5 max-w-2xl mx-auto">
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold font-headline text-foreground">Login Security</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Manage your login sessions and devices
                  </p>
                </div>

                {/* Active Devices Section */}
                <div className="bg-background rounded-xl border border-border/60 p-4 sm:p-5 shadow-sm space-y-3">
                  <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <Smartphone className="h-4 w-4 text-sidebar" />
                    Login Devices
                  </h4>
                  <div className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-200/70 dark:border-emerald-900/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300">Current Device</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">Active now</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Online</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This is your current active session. To view all devices, contact support.
                  </p>
                </div>

                {/* Logout All Devices */}
                <div className="bg-background rounded-xl border border-border/60 p-4 sm:p-5 shadow-sm space-y-3">
                  <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <LogOut className="h-4 w-4 text-rose-500" />
                    Logout from All Devices
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This will log you out from all devices including this one. You'll need to log in again.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleLogoutAllDevices}
                    className="w-full text-sm font-semibold h-10 rounded-xl shadow-xs"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout All Devices
                  </Button>
                </div>

                <div className="bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/70 dark:border-amber-900/40">
                  <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
                    <span className="font-bold">Security Tip:</span> Regularly review your active sessions and logout from devices you don't recognize.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "support" && (
              <div className="space-y-4 sm:space-y-5 max-w-2xl mx-auto">
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold font-headline text-foreground">Help & Support</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Get help with using the application
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-foreground">Frequently Asked Questions</h4>
                  <div className="space-y-2.5">
                    <details className="group bg-background rounded-xl p-4 border border-border/60 shadow-sm hover:shadow-md transition-shadow">
                      <summary className="cursor-pointer font-bold text-xs sm:text-sm text-foreground flex items-center justify-between">
                        <span>How do I reserve a room?</span>
                        <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed pl-0.5">
                        Go to Room Reservations → Reserve a Room, select your date, time, and room, then submit your request.
                      </p>
                    </details>
                    <details className="group bg-background rounded-xl p-4 border border-border/60 shadow-sm hover:shadow-md transition-shadow">
                      <summary className="cursor-pointer font-bold text-xs sm:text-sm text-foreground flex items-center justify-between">
                        <span>How do I view my QR code?</span>
                        <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed pl-0.5">
                        Click on "My QR Code" in the sidebar or bottom navigation to view your personal QR code.
                      </p>
                    </details>
                    <details className="group bg-background rounded-xl p-4 border border-border/60 shadow-sm hover:shadow-md transition-shadow">
                      <summary className="cursor-pointer font-bold text-xs sm:text-sm text-foreground flex items-center justify-between">
                        <span>How do I check my attendance?</span>
                        <span className="text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed pl-0.5">
                        Navigate to Attendance → Personal Log to view your attendance history.
                      </p>
                    </details>
                  </div>
                </div>

                <div className="bg-background rounded-xl border border-border/60 p-4 sm:p-5 shadow-sm space-y-3">
                  <h4 className="text-sm font-bold text-foreground">Need More Help?</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Contact the IT department or submit a problem report.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("report")} 
                    className="w-full text-sm font-semibold h-10 rounded-xl border-sidebar/30 hover:bg-sidebar/10 hover:text-sidebar"
                  >
                    Report a Problem
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "report" && (
              <div className="space-y-4 sm:space-y-5 max-w-2xl mx-auto">
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold font-headline text-foreground">Report a Problem</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Let us know if you're experiencing any issues
                  </p>
                </div>

                <div className="bg-background rounded-xl border border-border/60 p-4 sm:p-5 shadow-sm space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="issue-title" className="text-xs sm:text-sm font-semibold text-foreground">Issue Title</Label>
                    <Input
                      id="issue-title"
                      placeholder="Brief description of the problem"
                      className="text-sm h-10 rounded-xl border-border/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issue-description" className="text-xs sm:text-sm font-semibold text-foreground">Description</Label>
                    <textarea
                      id="issue-description"
                      className="flex min-h-[100px] sm:min-h-[120px] w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      placeholder="Please describe the problem in detail..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email" className="text-xs sm:text-sm font-semibold text-foreground">Contact Email (Optional)</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="Your email for follow-up"
                      defaultValue={user?.email || ""}
                      className="text-sm h-10 rounded-xl border-border/60"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      toast({
                        title: "Report Submitted",
                        description: "Thank you for your feedback. We'll look into this issue.",
                      });
                    }}
                    className="w-full text-sm font-semibold h-10 rounded-xl bg-sidebar hover:bg-sidebar/90 text-white shadow-xs"
                  >
                    Submit Report
                  </Button>
                </div>

                <div className="bg-blue-50/60 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200/70 dark:border-blue-900/40">
                  <p className="text-xs text-blue-900 dark:text-blue-300 leading-relaxed">
                    <span className="font-bold">Note:</span> Your report will be sent to the IT department for review. We typically respond within 24-48 hours.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
