
"use client";

import { AuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type SubscriptionStatus = 'loading' | 'trial' | 'pro' | 'free';

interface AuthContextType {
  user: AuthenticatedUser | null;
  subscriptionStatus: SubscriptionStatus;
  trialDaysRemaining: number;
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
  children,
  initialUser 
}: { 
  children: ReactNode,
  initialUser: AuthenticatedUser | null 
}) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(initialUser);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('loading');
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);

  useEffect(() => {
    // We now trust the initialUser from the server, so we just set the state based on that.
    setUser(initialUser);
    if (initialUser) {
      if (initialUser.is_pro) {
        setSubscriptionStatus('pro');
        setTrialDaysRemaining(0);
      } else {
        // auth_time is in seconds, convert to milliseconds
        const creationTime = new Date(initialUser.auth_time * 1000);
        const now = new Date();
        const trialDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        const trialEndTime = creationTime.getTime() + trialDuration;
        
        if (now.getTime() < trialEndTime) {
          setSubscriptionStatus('trial');
          const remainingMs = trialEndTime - now.getTime();
          setTrialDaysRemaining(Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
        } else {
          setSubscriptionStatus('free');
          setTrialDaysRemaining(0);
        }
      }
    } else {
      setSubscriptionStatus('free');
      setTrialDaysRemaining(0);
    }
  }, [initialUser]);

  return (
    <AuthContext.Provider value={{ user, subscriptionStatus, trialDaysRemaining }}>
      {children}
    </AuthContext.Provider>
  );
};
