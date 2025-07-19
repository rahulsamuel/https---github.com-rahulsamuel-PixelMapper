
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
  const sessionCookie = cookies().get("session")?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    // This will throw if the admin SDK is not configured, which we'll catch.
    getFirebaseAdminApp();
    const adminDb = getAdminDb();

    const decodedIdToken = await auth().verifySessionCookie(sessionCookie, true);
    
    // If we have an admin DB, try to enrich the user data
    if (adminDb) {
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
    }

    // Fallback if adminDb is not available (e.g., config error) but cookie is valid
    return { 
      uid: decodedIdToken.uid,
      email: decodedIdToken.email || null,
      name: decodedIdToken.name || decodedIdToken.email?.split('@')[0] || null,
      picture: decodedIdToken.picture || null,
      is_pro: (decodedIdToken as any).is_pro === true,
      auth_time: decodedIdToken.auth_time,
    };

  } catch (error: any) {
    // This can happen if the admin SDK is not configured OR if the cookie is invalid.
    // In either case, the user is not authenticated.
    if (error.code !== 'auth/session-cookie-expired' && error.code !== 'auth/session-cookie-revoked') {
      console.error("Error verifying session cookie or fetching user data:", error.message);
    }
    // Clear the invalid cookie
    cookies().delete("session");
    return null;
  }
}
