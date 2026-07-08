"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Church, LoaderCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
} from "@studio/ui";
import { useToast } from "@/hooks/use-toast";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase-client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Firebase's password-reset email links to this page with
  // ?mode=resetPassword&oobCode=... appended (the `url` passed to
  // sendPasswordResetEmail) — there is no session to detect, unlike
  // Supabase's PASSWORD_RECOVERY event flow this replaces.
  const oobCode = searchParams.get("oobCode");

  const [isValidCode, setIsValidCode] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      setIsCheckingCode(false);
      return;
    }
    verifyPasswordResetCode(firebaseAuth, oobCode)
      .then(() => setIsValidCode(true))
      .catch(() => setIsValidCode(false))
      .finally(() => setIsCheckingCode(false));
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password Too Short",
        description: "Your new password must be at least 6 characters.",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords Don't Match",
        description: "Please make sure both passwords match.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmPasswordReset(firebaseAuth, oobCode, password);

      toast({
        title: "Password Updated",
        description: "Your password has been changed. Please sign in with your new password.",
      });
      router.push("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update your password. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Church className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Set a New Password</CardTitle>
          <CardDescription>
            {isCheckingCode
              ? "Verifying your reset link…"
              : isValidCode
                ? "Enter and confirm your new password below."
                : "This password reset link is invalid or has expired. Please request a new one from the login page."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCheckingCode ? (
            <div className="flex justify-center py-6">
              <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : isValidCode ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          ) : (
            <Button className="w-full" onClick={() => router.push("/login")}>
              Back to Login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
