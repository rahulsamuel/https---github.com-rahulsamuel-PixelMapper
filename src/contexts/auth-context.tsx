
"use client";

import { useRouter } from "next/navigation";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string, company?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null; isAdmin?: boolean }>;
  signInAdmin: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Read is_admin from app_metadata — set server-side, embedded in the JWT, always current
function sessionIsAdmin(session: Session | null): boolean {
  return session?.user?.app_metadata?.['is_admin'] === true;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email! });
          setIsAdmin(sessionIsAdmin(session));
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email! });
          setIsAdmin(sessionIsAdmin(session));
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      })();
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string, company?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName ?? '', company: company ?? '' } },
      });

      if (error) return { error: error.message };

      if (data.user) {
        await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName ?? null,
          company: company ?? null,
        });
        router.push('/app');
      }
      return { error: null };
    } catch {
      return { error: "An unexpected error occurred" };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };

      if (data.user && data.session) {
        await supabase.from('users').upsert(
          { id: data.user.id, email: data.user.email! },
          { onConflict: 'id', ignoreDuplicates: true }
        );
        const admin = sessionIsAdmin(data.session);
        setUser({ id: data.user.id, email: data.user.email! });
        setIsAdmin(admin);
        return { error: null, isAdmin: admin };
      }
      return { error: null, isAdmin: false };
    } catch {
      return { error: "An unexpected error occurred" };
    }
  };

  const signInAdmin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (!data.user || !data.session) return { error: "Authentication failed" };

      const admin = sessionIsAdmin(data.session);
      if (!admin) {
        await supabase.auth.signOut();
        return { error: "Access denied. Admin privileges required." };
      }

      await supabase.from('users').upsert(
        { id: data.user.id, email: data.user.email! },
        { onConflict: 'id', ignoreDuplicates: true }
      );

      setUser({ id: data.user.id, email: data.user.email! });
      setIsAdmin(true);
      return { error: null };
    } catch {
      return { error: "An unexpected error occurred" };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signUp, signIn, signInAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
