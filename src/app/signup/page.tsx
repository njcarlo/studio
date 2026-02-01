"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Church } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, collection, serverTimestamp } from "firebase/firestore";

export default function SignUpPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill out all fields.",
      });
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const newProfile = {
        firstName,
        lastName,
        email,
        role: 'Mentee',
        status: 'Pending Approval',
        permissions: [],
        phone: '',
        avatarUrl: `https://picsum.photos/seed/${user.uid.slice(0, 5)}/100/100`,
        passwordChangeRequired: true,
      };

      const workerRef = doc(firestore, 'worker_profiles', user.uid);
      // Use await here to ensure profile is created before moving on
      await setDoc(workerRef, newProfile, {});

      await addDocumentNonBlocking(collection(firestore, "approvals"), {
        requester: `${firstName} ${lastName}`,
        type: 'New Worker',
        details: `New worker registration for ${firstName} ${lastName}.`,
        date: serverTimestamp(),
        status: 'Pending',
        workerId: user.uid
      });
      
      toast({
        title: "Account Created",
        description: "Your account has been created and is pending approval. You will be redirected.",
      });
      
      router.push("/dashboard");

    } catch (error: any) {
      let description = "An unknown error occurred.";
      if (error.code === 'auth/email-already-in-use') {
        description = "This email address is already in use.";
      } else if (error.code === 'auth/weak-password') {
        description = "The password is too weak. It must be at least 6 characters long.";
      }
      toast({
        variant: "destructive",
        title: "Sign-up failed",
        description,
      });
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
          <CardDescription>
            Enter your details below to sign up for COGApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input id="first-name" placeholder="John" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input id="last-name" placeholder="Doe" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
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
            <Button onClick={handleSignUp} className="w-full">
              Sign Up
            </Button>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline">
                Login
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
