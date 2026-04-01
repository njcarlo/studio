"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Church, LoaderCircle, ChevronLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  Button,
  Input,
  Label,
} from "@studio/ui";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@studio/store";
import { supabase } from "@studio/database";
import { 
  legacyWorkerIdLogin, 
  getWorkerAuthStatus, 
  completeFirstLoginPasswordChange 
} from "@/actions/legacy-auth";

export default function LoginPage() {
  const [loginStep, setLoginStep] = useState<"identifier" | "password" | "migration">("identifier");
  const [mode, setMode] = useState<"email" | "worker">("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  
  // Migration specific state
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Reset Password state
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const { user, isUserLoading } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  
  const workerIdLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_WORKER_ID_LOGIN !== "false";

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isUserLoading, router]);

  const handleContinue = async () => {
    if (!identifier) {
      toast({
        variant: "destructive",
        title: "Identifier Required",
        description: `Please enter your ${mode === "email" ? "email" : "Worker ID"}.`,
      });
      return;
    }

    setIsCheckingStatus(true);
    try {
      const status = await getWorkerAuthStatus(identifier);
      
      if (!status.exists) {
        // If it doesn't exist in our DB, it might still be a direct Supabase user 
        // OR it's a completely new user. We proceed to password step to let Supabase handle it.
        setLoginStep("password");
      } else if (status.passwordChangeRequired) {
        setEmail(status.email || "");
        setLoginStep("migration");
      } else {
        setLoginStep("password");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to check account status. Please try again.",
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleSignIn = async () => {
    if (!password) {
      toast({
        variant: "destructive",
        title: "Password Required",
        description: "Please enter your password.",
      });
      return;
    }

    setIsSigningIn(true);
    try {
      let loginEmail = identifier;

      // If in worker mode, we need to get the email associated with the workerId
      if (mode === "worker") {
        const result = await legacyWorkerIdLogin(identifier, password);
        if (!result.success) {
          throw new Error(result.error || "Invalid Worker ID or password.");
        }
        if (!result.email) {
          throw new Error("Worker profile is missing an email address.");
        }
        loginEmail = result.email;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
      setIsSigningIn(false);
    }
  };

  const handleCompletePasswordChange = async () => {
    // Determine which verification value to use
    const verificationValue = mode === "worker" ? firstName : password;

    if (!verificationValue || !newPassword || !confirmPassword || !email) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: `Please fill out all ${mode === "worker" ? "identity, email, and password" : "password"} fields.`,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please ensure both new passwords are the same.",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "New password must be at least 6 characters.",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await completeFirstLoginPasswordChange(
        identifier,
        verificationValue,
        newPassword,
        mode,
        email
      );

      if (!result.success || !result.email) {
        throw new Error(result.error || "Failed to update account.");
      }

      // Now sign in with the NEW password and NEW email
      const { error } = await supabase.auth.signInWithPassword({
        email: result.email,
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Account Migrated",
        description: "Your password and email have been confirmed successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
      setIsChangingPassword(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email.",
      });
      return;
    }
    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      toast({
        title: "Reset Email Sent",
        description: `Instructions sent to ${resetEmail}`,
      });
      setIsResetDialogOpen(false);
      setResetEmail("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.message,
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center items-center">
            <Church className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">
            COG App Login
          </CardTitle>
          <CardDescription>
            {loginStep === "identifier" && (mode === "email" ? "Enter your email to continue" : "Enter your Worker ID to continue")}
            {loginStep === "password" && "Enter your password to login"}
            {loginStep === "migration" && (mode === "worker" ? "Security check: verify your name" : "First-time setup: reset your password")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {loginStep === "identifier" ? (
              <>
                <div className={`grid gap-2 ${workerIdLoginEnabled ? "grid-cols-2" : "grid-cols-1"}`}>
                  <Button
                    type="button"
                    variant={mode === "email" ? "default" : "outline"}
                    onClick={() => setMode("email")}
                    disabled={isCheckingStatus}
                  >
                    Email Login
                  </Button>
                  {workerIdLoginEnabled && (
                    <Button
                      type="button"
                      variant={mode === "worker" ? "default" : "outline"}
                      onClick={() => setMode("worker")}
                      disabled={isCheckingStatus}
                    >
                      Worker ID Login
                    </Button>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="identifier">{mode === "email" ? "Email" : "Worker ID"}</Label>
                  <Input
                    id="identifier"
                    type={mode === "email" ? "email" : "text"}
                    placeholder={mode === "email" ? "m@example.com" : "e.g. W1042"}
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={isCheckingStatus}
                    onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                  />
                </div>

                <Button onClick={handleContinue} className="w-full" disabled={isCheckingStatus}>
                  {isCheckingStatus ? <LoaderCircle className="animate-spin" /> : "Continue"}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <button 
                  onClick={() => setLoginStep("identifier")}
                  className="flex items-center text-xs text-muted-foreground hover:text-primary transition-colors mb-2"
                >
                  <ChevronLeft className="h-3 w-3 mr-1" />
                  Back: {identifier}
                </button>

                {loginStep === "password" ? (
                  <>
                    <div className="grid gap-2">
                      <div className="flex items-center">
                        <Label htmlFor="password">Password</Label>
                        {mode === "email" && (
                          <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                            <DialogTrigger asChild>
                              <button type="button" className="ml-auto inline-block text-sm underline hover:text-primary transition-colors">
                                Forgot password?
                              </button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Reset Password</DialogTitle>
                                <DialogDescription>Enter your email for reset instructions.</DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-2 py-4">
                                <Label htmlFor="reset-email">Email</Label>
                                <Input id="reset-email" placeholder="m@example.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} disabled={isResetting} />
                              </div>
                              <DialogFooter>
                                <Button type="button" onClick={handlePasswordReset} disabled={isResetting} className="w-full">
                                  {isResetting && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                                  Send Reset Link
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSigningIn}
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                      />
                    </div>
                    <Button onClick={handleSignIn} className="w-full" disabled={isSigningIn}>
                      {isSigningIn ? <LoaderCircle className="animate-spin" /> : "Login"}
                    </Button>
                  </>
                ) : (
                  <div className="grid gap-4">
                    {mode === "worker" ? (
                      <div className="grid gap-2">
                        <Label htmlFor="first-name">Confirmation: Your First Name</Label>
                        <Input
                          id="first-name"
                          type="text"
                          placeholder="Exactly as in COG records"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          disabled={isChangingPassword}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        <Label htmlFor="old-password">Current (Legacy) Password</Label>
                        <Input
                          id="old-password"
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isChangingPassword}
                          autoFocus
                        />
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label htmlFor="email">Confirm Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isChangingPassword}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        This email will be used for all future logins.
                      </p>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isChangingPassword}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isChangingPassword}
                        onKeyDown={(e) => e.key === "Enter" && handleCompletePasswordChange()}
                      />
                    </div>
                    <Button onClick={handleCompletePasswordChange} className="w-full" disabled={isChangingPassword}>
                      {isChangingPassword ? <LoaderCircle className="animate-spin mr-2" /> : "Set Password & Login"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline hover:text-primary">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
