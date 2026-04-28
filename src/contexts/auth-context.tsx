
"use client";

import { useRouter } from "next/navigation";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string, company?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
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

async function fetchIsAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .maybeSingle();
  return data?.is_admin === true;
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
          setIsAdmin(await fetchIsAdmin(session.user.id));
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
          setIsAdmin(await fetchIsAdmin(session.user.id));
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

      if (data.user) {
        await supabase.from('users').upsert(
          { id: data.user.id, email: data.user.email! },
          { onConflict: 'id', ignoreDuplicates: true }
        );
        const admin = await fetchIsAdmin(data.user.id);
        setUser({ id: data.user.id, email: data.user.email! });
        setIsAdmin(admin);
        router.push(admin ? '/admin/tracking' : '/app');
      }
      return { error: null };
    } catch {
      return { error: "An unexpected error occurred" };
    }
  };

  const signInAdmin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (!data.user) return { error: "Authentication failed" };

      await supabase.from('users').upsert(
        { id: data.user.id, email: data.user.email! },
        { onConflict: 'id', ignoreDuplicates: true }
      );

      const admin = await fetchIsAdmin(data.user.id);
      if (!admin) {
        await supabase.auth.signOut();
        return { error: "Access denied. Admin privileges required." };
      }

      setIsAdmin(true);
      router.push('/admin/tracking');
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
