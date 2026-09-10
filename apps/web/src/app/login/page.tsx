"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LoaderCircle, Eye, EyeOff } from "lucide-react";
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
import { getWorkerEmail } from "@/actions/legacy-auth";

export default function LoginPage() {
  const [mode, setMode] = useState<"email" | "worker">("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Reset Password state
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { user, isUserLoading } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isUserLoading, router]);

  // Reset identifier when switching modes
  const handleModeSwitch = (newMode: "email" | "worker") => {
    setMode(newMode);
    setIdentifier("");
    setPassword("");
  };

  const handleSignIn = async () => {
    if (!identifier || !password) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: `Please enter your ${mode === "email" ? "email" : "Worker ID"} and password.`,
      });
      return;
    }

    setIsSigningIn(true);
    try {
      let loginEmail = identifier;

      if (mode === "worker") {
        const result = await getWorkerEmail(identifier);
        if (!result.success || !result.email) {
          throw new Error(result.error || "Worker ID not found.");
        }
        loginEmail = result.email;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
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
    <div className="relative flex min-h-screen items-center justify-center p-4">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/cog-bg.png"
          alt="Background"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Overlay for better card visibility */}
        <div className="absolute inset-0 bg-black/30" />
        {/* Vignette effect - dark shadow around edges */}
        <div className="absolute inset-0 shadow-[inset_0_0_120px_60px_rgba(0,0,0,0.5)]" />
      </div>

      <Card className="relative z-10 mx-auto max-w-md w-full shadow-[0_8px_32px_0_rgba(0,0,0,0.9),0_0_80px_rgba(0, 0, 0, 0.9)] backdrop-blur-xl bg-black/10 border border-black/20 dark:bg-black/5 dark:border-black/10">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center items-center">
            <Image src="/church-logo.png" alt="COG Logo" width={80} height={80} className="rounded-sm drop-shadow-[0_4px_8px_rgba(0, 0, 0, 0.9)]" />
          </div>
          <CardTitle className="font-headline text-2xl text-white">COG App</CardTitle>
          <CardDescription className="text-white/90">
            {mode === "email" ? "Enter your email and password" : "Enter your Worker ID and password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={mode === "email" ? "default" : "outline"}
                onClick={() => handleModeSwitch("email")}
                disabled={isSigningIn}
              >
                Email Login
              </Button>
              <Button
                type="button"
                variant={mode === "worker" ? "default" : "outline"}
                onClick={() => handleModeSwitch("worker")}
                disabled={isSigningIn}
              >
                Worker ID Login
              </Button>
            </div>

            {/* Identifier */}
            <div className="grid gap-2">
              <Label htmlFor="identifier" className="text-white">{mode === "email" ? "Email" : "Worker ID"}</Label>
              <Input
                id="identifier"
                type={mode === "email" ? "email" : "text"}
                placeholder={mode === "email" ? "m@example.com" : "e.g. 01042"}
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isSigningIn}
                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
              />
            </div>

            {/* Password */}
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password" className="text-white">Password</Label>
                {mode === "email" && (
                  <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="ml-auto inline-block text-sm underline text-white/90 hover:text-white transition-colors"
                      >
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
                        <Input
                          id="reset-email"
                          placeholder="m@example.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          disabled={isResetting}
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          onClick={handlePasswordReset}
                          disabled={isResetting}
                          className="w-full"
                        >
                          {isResetting && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                          Send Reset Link
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSigningIn}
                  onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button onClick={handleSignIn} className="w-full" disabled={isSigningIn}>
              {isSigningIn ? <LoaderCircle className="animate-spin" /> : "Login"}
            </Button>
          </div>


        </CardContent>
      </Card>
    </div>
  );
}
