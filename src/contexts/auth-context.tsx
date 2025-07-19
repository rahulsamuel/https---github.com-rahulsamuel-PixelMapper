
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthenticatedUser } from "@/lib/auth/get-authenticated-user";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/auth/firebase";

type SubscriptionStatus = 'loading' | 'trial' | 'pro' | 'free';

interface AuthContextType {
  user: AuthenticatedUser | null;
  firebaseUser: FirebaseUser | null;
  subscriptionStatus: SubscriptionStatus;
  trialDaysRemaining: number;
  loading: boolean;
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
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('loading');
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set user state based on server-provided data
    setUser(initialUser);

    // Determine subscription status from the initial user object
    if (initialUser) {
      if (initialUser.is_pro) {
        setSubscriptionStatus('pro');
        setTrialDaysRemaining(0);
      } else {
        const creationTime = new Date(initialUser.auth_time * 1000);
        const now = new Date();
        const trialDuration = 7 * 24 * 60 * 60 * 1000;
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
    
    // The onAuthStateChanged listener is mainly for getting the firebaseUser object
    // for client-side actions (like password changes), and for client-side navigation triggers.
    // It should NOT be the primary source for the `user` state which includes firestore data.
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setLoading(false); // Set loading to false once we have a definitive answer from Firebase client.
    });

    return () => unsubscribe();
  }, [initialUser]);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, subscriptionStatus, trialDaysRemaining, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
