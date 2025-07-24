
"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type SubscriptionStatus = 'loading' | 'trial' | 'pro' | 'free';

interface AuthContextType {
  user: null;
  subscriptionStatus: SubscriptionStatus;
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
  // Mock subscription status. Change 'pro' to 'trial' or 'free' to test different states.
  const [subscriptionStatus] = useState<SubscriptionStatus>('pro');

  const value = {
      user: null, // No user object when auth is removed
      subscriptionStatus,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
