"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { firebaseAuth } from "./firebase-client";

// Replaces packages/database's SupabaseProvider/useSupabase/useSupabaseUser
// as of the Phase 1 auth cutover (migration plan §11).
//
// Also keeps the httpOnly session cookie (read server-side by
// lib/firebase-auth-server.ts) in sync with the client SDK's auth state —
// Firebase's web SDK only persists tokens in IndexedDB/memory, so without
// this, Server Actions/middleware would never see a signed-in user.

interface FirebaseAuthContextState {
  user: User | null;
  isLoading: boolean;
  error: any | null;
}

export const FirebaseAuthContext = createContext<FirebaseAuthContextState | undefined>(
  undefined,
);

async function syncSessionCookie(user: User | null) {
  try {
    if (user) {
      const idToken = await user.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
    } else {
      await fetch("/api/auth/session", { method: "DELETE" });
    }
  } catch (e) {
    console.error("[FirebaseAuthProvider] session cookie sync failed:", e);
  }
}

export const FirebaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setIsLoading(false);
        setError(null);
        // Fire-and-forget — the cookie write shouldn't block UI state.
        void syncSessionCookie(firebaseUser);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, error }),
    [user, isLoading, error],
  );

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};

export const useFirebaseAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error("useFirebaseAuth must be used within a FirebaseAuthProvider");
  }
  return context;
};

export const useFirebaseUser = () => {
  const { user, isLoading, error } = useFirebaseAuth();
  return { user, isLoading, error };
};
