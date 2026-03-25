"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Church, LoaderCircle } from "lucide-react";
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
import { legacyWorkerIdLogin } from "@/actions/legacy-auth";

export default function LoginPage() {
  const [mode, setMode] = useState<"email" | "worker">("email");
  const [email, setEmail] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const { user, isUserLoading } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  const workerIdLoginEnabled =
    process.env.NEXT_PUBLIC_ENABLE_WORKER_ID_LOGIN !== "false";

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (!workerIdLoginEnabled && mode === "worker") {
      setMode("email");
    }
  }, [workerIdLoginEnabled, mode]);

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please enter both email and password.",
      });
      return;
    }
    setIsSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Auth state change triggers redirect via useEffect
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
      setIsSigningIn(false);
    }
  };

  const handleWorkerIdSignIn = async () => {
    if (!workerIdLoginEnabled) {
      toast({
        variant: "destructive",
        title: "Worker ID login disabled",
        description: "Please use email login.",
      });
      return;
    }

    const parsed = Number(workerId);
    if (!workerId || !Number.isInteger(parsed) || parsed <= 0 || !password) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please enter a valid Worker ID and password.",
      });
      return;
    }

    setIsSigningIn(true);
    try {
      const result = await legacyWorkerIdLogin(parsed, password);
      if (!result.success || !result.email) {
        throw new Error(result.error || "Invalid Worker ID or password.");
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: result.email,
        password,
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
            {mode === "email" || !workerIdLoginEnabled
              ? "Enter your email below to login to your account"
              : "Use your Worker ID and legacy password to login"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div
              className={`grid gap-2 ${workerIdLoginEnabled ? "grid-cols-2" : "grid-cols-1"}`}
            >
              <Button
                type="button"
                variant={mode === "email" ? "default" : "outline"}
                onClick={() => setMode("email")}
                disabled={isSigningIn}
              >
                Email Login
              </Button>
              {workerIdLoginEnabled && (
                <Button
                  type="button"
                  variant={mode === "worker" ? "default" : "outline"}
                  onClick={() => setMode("worker")}
                  disabled={isSigningIn}
                >
                  Worker ID Login
                </Button>
              )}
            </div>

            {mode === "email" || !workerIdLoginEnabled ? (
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSigningIn}
                />
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="worker-id">Worker ID</Label>
                <Input
                  id="worker-id"
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g. 1042"
                  required
                  value={workerId}
                  onChange={(e) => setWorkerId(e.target.value)}
                  disabled={isSigningIn}
                />
              </div>
            )}
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                {mode === "email" && (
                  <Dialog
                    open={isResetDialogOpen}
                    onOpenChange={setIsResetDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="ml-auto inline-block text-sm underline hover:text-primary transition-colors"
                      >
                        Forgot your password?
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                          Enter your email and we'll send a reset link.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex items-center space-x-2 py-4">
                        <div className="grid flex-1 gap-2">
                          <Label htmlFor="reset-email" className="sr-only">
                            Email
                          </Label>
                          <Input
                            id="reset-email"
                            placeholder="m@example.com"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            disabled={isResetting}
                          />
                        </div>
                      </div>
                      <DialogFooter className="sm:justify-start">
                        <Button
                          type="button"
                          onClick={handlePasswordReset}
                          disabled={isResetting}
                          className="w-full sm:w-auto"
                        >
                          {isResetting ? (
                            <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
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
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  (mode === "email" ? handleSignIn() : handleWorkerIdSignIn())
                }
              />
            </div>
            <Button
              onClick={mode === "email" ? handleSignIn : handleWorkerIdSignIn}
              className="w-full"
              disabled={isSigningIn || isUserLoading}
            >
              {isSigningIn ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                "Login"
              )}
            </Button>
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
