"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Church, LoaderCircle } from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter, Button, Input, Label,
} from "@studio/ui";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@studio/store";
import { useAuth, initiatePasswordReset } from "@studio/database";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const { user, isUserLoading } = useAuthStore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isUserLoading, router]);

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please enter both email and password." });
      return;
    }
    setIsSigningIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Auth state change triggers redirect via useEffect
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
      setIsSigningIn(false);
    }
  };

  const handlePasswordReset = () => {
    if (!resetEmail) {
      toast({ variant: "destructive", title: "Email Required", description: "Please enter your email." });
      return;
    }
    setIsResetting(true);
    initiatePasswordReset(
      auth,
      resetEmail,
      () => {
        toast({ title: "Reset Email Sent", description: `Instructions sent to ${resetEmail}` });
        setIsResetDialogOpen(false);
        setResetEmail("");
        setIsResetting(false);
      },
      (error) => {
        toast({ variant: "destructive", title: "Reset Failed", description: error.message });
        setIsResetting(false);
      }
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center items-center">
            <Church className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">COG App Login</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required value={email}
                onChange={(e) => setEmail(e.target.value)} disabled={isSigningIn} />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                  <DialogTrigger asChild>
                    <button type="button" className="ml-auto inline-block text-sm underline hover:text-primary transition-colors">
                      Forgot your password?
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Reset Password</DialogTitle>
                      <DialogDescription>Enter your email and we'll send a reset link.</DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2 py-4">
                      <div className="grid flex-1 gap-2">
                        <Label htmlFor="reset-email" className="sr-only">Email</Label>
                        <Input id="reset-email" placeholder="m@example.com" value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)} disabled={isResetting} />
                      </div>
                    </div>
                    <DialogFooter className="sm:justify-start">
                      <Button type="button" onClick={handlePasswordReset} disabled={isResetting} className="w-full sm:w-auto">
                        {isResetting ? <LoaderCircle className="h-4 w-4 animate-spin mr-2" /> : null}
                        Send Reset Link
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Input id="password" type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)} disabled={isSigningIn}
                onKeyDown={(e) => e.key === 'Enter' && handleSignIn()} />
            </div>
            <Button onClick={handleSignIn} className="w-full" disabled={isSigningIn || isUserLoading}>
              {isSigningIn ? <LoaderCircle className="animate-spin" /> : "Login"}
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline hover:text-primary">Sign up</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
