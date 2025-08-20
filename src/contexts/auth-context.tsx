
"use client";

import { useRouter } from "next/navigation";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

type SubscriptionStatus = 'loading' | 'trial' | 'pro' | 'free';

// For now, user can be a simple object. In a real app, this would be more complex.
interface User {
  email: string;
}

interface AuthContextType {
  user: User | null;
  subscriptionStatus: SubscriptionStatus;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ 
  children
}: { 
  children: ReactNode
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [subscriptionStatus] = useState<SubscriptionStatus>('pro');
  const router = useRouter();

  // On initial load, check if user is stored (e.g., in localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (email: string) => {
    // In a real app, you'd verify credentials against a server
    const newUser = { email };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    router.push('/admin/tracking');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/');
  };


  const value: AuthContextType = {
      user,
      subscriptionStatus,
      login,
      logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
