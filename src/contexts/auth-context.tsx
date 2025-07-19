
"use client";

import { getAuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type SubscriptionStatus = 'loading' | 'trial' | 'pro' | 'free';

interface AuthContextType {
  user: Awaited<ReturnType<typeof getAuthenticatedUser>>;
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Awaited<ReturnType<typeof getAuthenticatedUser>>>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('loading');
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getAuthenticatedUser();
        setUser(currentUser);

        if (currentUser) {
          // In a real app, you'd fetch this from your database or custom claims
          const isPro = currentUser.custom_claims?.is_pro === true;

          if (isPro) {
            setSubscriptionStatus('pro');
            setTrialDaysRemaining(0);
          } else {
            const creationTime = new Date(currentUser.auth_time * 1000);
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
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
        setSubscriptionStatus('free');
      }
    };

    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, subscriptionStatus, trialDaysRemaining }}>
      {children}
    </AuthContext.Provider>
  );
};
