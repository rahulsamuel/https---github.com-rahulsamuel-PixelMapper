
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
  signUp: (email: string, password: string, captchaToken: string, fullName?: string, company?: string) => Promise<{ error: string | null; needsVerification?: boolean }>;
  signIn: (email: string, password: string, captchaToken: string) => Promise<{ error: string | null; isAdmin?: boolean; needsVerification?: boolean }>;
  requestPasswordReset: (email: string, captchaToken: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
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

function sessionIsAdmin(session: Session | null): boolean {
  return session?.user?.app_metadata?.['is_admin'] === true;
}

function verifiedUser(session: Session | null): User | null {
  const sessionUser = session?.user;
  if (!sessionUser?.email_confirmed_at) return null;
  return { id: sessionUser.id, email: sessionUser.email! };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const timeoutId = window.setTimeout(() => setLoading(false), 8000);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const verified = verifiedUser(session);
        setUser(verified);
        setIsAdmin(verified ? sessionIsAdmin(session) : false);
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        window.clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        const verified = verifiedUser(session);
        setUser(verified);
        setIsAdmin(verified ? sessionIsAdmin(session) : false);
      })();
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  const signUp = async (email: string, password: string, captchaToken: string, fullName?: string, company?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName ?? '', company: company ?? '' },
          emailRedirectTo: `${window.location.origin}/app`,
          captchaToken,
        },
      });
      if (error) return { error: error.message };
      if (!data.session) return { error: null, needsVerification: true };
      if (data.user) {
        await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName ?? null,
          company: company ?? null,
        });
      }
      router.push('/app');
      return { error: null, needsVerification: false };
    } catch {
      return { error: "An unexpected error occurred" };
    }
  };

  const signIn = async (email: string, password: string, captchaToken: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken },
      });
      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          return { error: null, needsVerification: true };
        }
        if (error.message.includes('timeout') || error.message.includes('504') || error.message.includes('Gateway')) {
          return { error: "The server is taking too long to respond. Please try again in a moment." };
        }
        return { error: error.message };
      }
      if (data.user && data.session) {
        const metadata = data.user.user_metadata ?? {};
        await supabase.from('users').upsert(
          {
            id: data.user.id,
            email: data.user.email!,
            full_name: typeof metadata.full_name === 'string' && metadata.full_name ? metadata.full_name : null,
            company: typeof metadata.company === 'string' && metadata.company ? metadata.company : null,
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );
        const admin = sessionIsAdmin(data.session);
        setUser({ id: data.user.id, email: data.user.email! });
        setIsAdmin(admin);
        return { error: null, isAdmin: admin };
      }
      return { error: null, isAdmin: false };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('timeout') || msg.includes('504') || msg.includes('fetch')) {
        return { error: "Network error — the server is slow to respond. Please try again." };
      }
      return { error: "An unexpected error occurred. Please try again." };
    }
  };

  const requestPasswordReset = async (email: string, captchaToken: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
        captchaToken,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch {
      return { error: "An unexpected error occurred. Please try again." };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { error: error.message };
      return { error: null };
    } catch {
      return { error: "An unexpected error occurred. Please try again." };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signUp, signIn, requestPasswordReset, updatePassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
