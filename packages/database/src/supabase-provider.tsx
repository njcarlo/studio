"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { SupabaseClient, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabase-client";

interface SupabaseContextState {
  supabase: SupabaseClient;
  user: User | null;
  isLoading: boolean;
  error: any | null;
}

export const SupabaseContext = createContext<SupabaseContextState | undefined>(
  undefined,
);

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError(
        new Error(
          "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        ),
      );
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!cancelled) {
        if (session?.user) {
          setUser(session.user);
          setIsLoading(false);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setIsLoading(false);
        }
      }
    });

    // Initial check — use getSession first to retrieve and refresh stored credentials
    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          if (!cancelled) {
            setUser(session.user);
            setIsLoading(false);
          }

          // In the background, verify against the server without booting out offline/mobile users
          try {
            const {
              data: { user: verifiedUser },
            } = await supabase.auth.getUser();

            if (!cancelled && verifiedUser) {
              setUser(verifiedUser);
            }
          } catch {
            // Keep active session.user if network is temporarily slow or offline
          }
        } else {
          if (!cancelled) {
            setUser(null);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    checkUser();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      supabase,
      user,
      isLoading,
      error,
    }),
    [user, isLoading, error],
  );

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
};

export const useSupabaseUser = () => {
  const { user, isLoading, error } = useSupabase();
  return { user, isLoading, error };
};
