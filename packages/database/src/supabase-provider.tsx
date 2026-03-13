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

    // Initial check
    const checkUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        setUser(user);
        setError(error);
      } catch (e) {
        setError(e);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
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
