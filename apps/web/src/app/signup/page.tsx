"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Church } from "lucide-react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@studio/ui";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@studio/database";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { createWorker, createApproval } from "@/actions/db";

export default function SignUpPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please fill out all fields." });
      return;
    }
    setIsLoading(true);
    try {
      // 1. Create Firebase auth user
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      const uid = user.uid;

      // 2. Create worker profile in Prisma DB
      await createWorker({
        id: uid,
        firstName,
        lastName,
        email,
        roleId: 'viewer',
        status: 'Pending Approval',
        avatarUrl: `https://picsum.photos/seed/${uid.slice(0, 5)}/100/100`,
        workerId: String(20000 + Math.floor(Math.random() * 1000)).padStart(6, '0'),
      });

      // 3. Create approval request
      await createApproval({
        requester: `${firstName} ${lastName}`,
        type: 'New Worker',
        details: `New worker self-registration: ${email}.`,
        status: 'Pending',
        workerId: uid,
      });

      toast({ title: "Registration Submitted", description: "Your account is pending approval." });
      router.push("/login");
    } catch (error: any) {
      let description = error.message || "An unknown error occurred.";
      if (error.code === 'auth/email-already-in-use') {
        description = "This email address is already in use.";
      }
      toast({ variant: "destructive", title: "Sign-up failed", description });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center items-center">
            <Church className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Create an Account</CardTitle>
          <CardDescription>Enter your details below to sign up</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="John" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button onClick={handleSignUp} className="w-full" disabled={isLoading}>
              {isLoading ? "Signing up..." : "Sign Up"}
            </Button>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline">Login</Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
