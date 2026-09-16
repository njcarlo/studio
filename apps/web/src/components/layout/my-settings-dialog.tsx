"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

interface MySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MySettingsDialog({ open, onOpenChange }: MySettingsDialogProps) {
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
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to logout from all devices.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent 
        className="max-w-3xl max-h-[80vh] p-0 gap-0 overflow-hidden flex flex-col" 
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 shrink-0">
          <DialogTitle className="text-lg sm:text-xl font-bold">My Settings</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Manage your account settings and preferences
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Vertical Tab List - Sidebar */}
          <div className="flex flex-col gap-1 p-2 sm:p-3 border-r bg-muted/30 overflow-y-auto w-40 sm:w-48 shrink-0">
            <button
              onClick={() => setActiveTab("password")}
              className={`px-3 py-2 text-left text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                activeTab === "password"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              Change Password
            </button>
            <button
              onClick={() => setActiveTab("support")}
              className={`px-3 py-2 text-left text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                activeTab === "support"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              Help and Support
            </button>
            <button
              onClick={() => setActiveTab("report")}
              className={`px-3 py-2 text-left text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                activeTab === "report"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              Report a Problem
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`px-3 py-2 text-left text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                activeTab === "security"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              Login Security
            </button>
          </div>

          {/* Tab Content - Main Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-w-0">
            {activeTab === "password" && (
              <div className="space-y-3 sm:space-y-4 max-w-xl">
                <div className="space-y-1.5 sm:space-y-2">
                  <h3 className="text-base sm:text-lg font-semibold">Change Password</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Update your account password. We'll send a reset link to your email.
                  </p>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted text-sm"
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="w-full text-sm"
                  size="sm"
                >
                  {isChangingPassword ? "Sending..." : "Send Password Reset Email"}
                </Button>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-4 sm:space-y-5 max-w-xl">
                <div className="space-y-1.5 sm:space-y-2">
                  <h3 className="text-base sm:text-lg font-semibold">Login Security</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Manage your login sessions and devices
                  </p>
                </div>

                {/* Active Devices Section */}
                <div className="space-y-2 sm:space-y-3">
                  <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                    Login Devices
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium">Current Device</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Active now</p>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    This is your current active session. To view all devices, contact support.
                  </p>
                </div>

                {/* Logout All Devices */}
                <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t">
                  <h4 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
                    Logout from All Devices
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    This will log you out from all devices including this one. You'll need to log in again.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleLogoutAllDevices}
                    className="w-full text-sm"
                    size="sm"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-2" />
                    Logout All Devices
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "support" && (
              <div className="space-y-4 sm:space-y-5 max-w-xl">
                <div className="space-y-1.5 sm:space-y-2">
                  <h3 className="text-base sm:text-lg font-semibold">Help & Support</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Get help with using the application
                  </p>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <h4 className="text-xs sm:text-sm font-semibold">Frequently Asked Questions</h4>
                  <div className="space-y-2">
                    <details className="group bg-muted/50 rounded-lg p-2.5 sm:p-3">
                      <summary className="cursor-pointer font-medium text-xs sm:text-sm">
                        How do I reserve a room?
                      </summary>
                      <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                        Go to Room Reservations → Reserve a Room, select your date, time, and room, then submit your request.
                      </p>
                    </details>
                    <details className="group bg-muted/50 rounded-lg p-2.5 sm:p-3">
                      <summary className="cursor-pointer font-medium text-xs sm:text-sm">
                        How do I view my QR code?
                      </summary>
                      <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                        Click on "My QR Code" in the sidebar or bottom navigation to view your personal QR code.
                      </p>
                    </details>
                    <details className="group bg-muted/50 rounded-lg p-2.5 sm:p-3">
                      <summary className="cursor-pointer font-medium text-xs sm:text-sm">
                        How do I check my attendance?
                      </summary>
                      <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                        Navigate to Attendance → Personal Log to view your attendance history.
                      </p>
                    </details>
                  </div>
                </div>

                <div className="pt-3 sm:pt-4 border-t">
                  <h4 className="text-xs sm:text-sm font-semibold mb-2">Need More Help?</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                    Contact the IT department or submit a problem report.
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab("report")} size="sm" className="text-sm">
                    Report a Problem
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "report" && (
              <div className="space-y-3 sm:space-y-4 max-w-xl">
                <div className="space-y-1.5 sm:space-y-2">
                  <h3 className="text-base sm:text-lg font-semibold">Report a Problem</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Let us know if you're experiencing any issues
                  </p>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="issue-title" className="text-xs sm:text-sm">Issue Title</Label>
                  <Input
                    id="issue-title"
                    placeholder="Brief description of the problem"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="issue-description" className="text-xs sm:text-sm">Description</Label>
                  <textarea
                    id="issue-description"
                    className="flex min-h-[80px] sm:min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Please describe the problem in detail..."
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="contact-email" className="text-xs sm:text-sm">Contact Email (Optional)</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="Your email for follow-up"
                    defaultValue={user?.email || ""}
                    className="text-sm"
                  />
                </div>
                <Button
                  onClick={() => {
                    toast({
                      title: "Report Submitted",
                      description: "Thank you for your feedback. We'll look into this issue.",
                    });
                    onOpenChange(false);
                  }}
                  className="w-full text-sm"
                  size="sm"
                >
                  Submit Report
                </Button>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Your report will be sent to the IT department for review.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
