'use server';

import { auth } from "firebase-admin";
import { cookies } from "next/headers";
import { getFirebaseAdminApp, getAdminDb } from "./firebase-admin";

export interface AuthenticatedUser {
    uid: string;
    email: string | null;
    name: string | null;
    picture: string | null;
    is_pro: boolean;
    auth_time: number;
}


export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const adminApp = getFirebaseAdminApp();
  if (!adminApp) {
    return null;
  }
  
  const sessionCookie = cookies().get("session")?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedIdToken = await auth().verifySessionCookie(sessionCookie, true);
    
    const adminDb = getAdminDb();
    if (!adminDb) {
      return { 
        uid: decodedIdToken.uid,
        email: decodedIdToken.email || null,
        name: decodedIdToken.name || decodedIdToken.email?.split('@')[0] || null,
        picture: decodedIdToken.picture || null,
        is_pro: (decodedIdToken as any).is_pro === true,
        auth_time: decodedIdToken.auth_time,
      };
    }

    const userDocRef = adminDb.collection("users").doc(decodedIdToken.uid);
    const userDoc = await userDocRef.get();

    const firestoreData = userDoc.exists ? userDoc.data() : {};

    const userProfile: AuthenticatedUser = {
        uid: decodedIdToken.uid,
        email: decodedIdToken.email || null,
        name: firestoreData?.name || decodedIdToken.name || decodedIdToken.email?.split('@')[0] || null,
        picture: firestoreData?.picture || decodedIdToken.picture || null,
        is_pro: (decodedIdToken as any).is_pro === true || firestoreData?.is_pro === true,
        auth_time: decodedIdToken.auth_time,
    };
    
    // To test the "pro" state, you can uncomment the following line:
    // userProfile.is_pro = true;

    return userProfile;
  } catch (error) {
    console.error("Error verifying session cookie or fetching user data:", error);
    return null;
  }
}
