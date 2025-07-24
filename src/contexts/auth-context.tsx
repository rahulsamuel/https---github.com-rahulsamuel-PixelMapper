
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

  return (
    <AuthContext.Provider value={{ user: null, subscriptionStatus }}>
      {children}
    </AuthContext.Provider>
  );
};
