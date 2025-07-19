'use server';

import { auth } from "firebase-admin";
import { cookies } from "next/headers";
import { getFirebaseAdminApp, getAdminDb } from "./firebase-admin";

export async function getAuthenticatedUser() {
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
      // If DB is not available, return auth data only
      return { ...decodedIdToken, name: decodedIdToken.email?.split('@')[0] };
    }

    // Fetch user data from Firestore
    const userDocRef = adminDb.collection("users").doc(decodedIdToken.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
        // This case might happen if the user was deleted from Firestore but not Auth
        return { ...decodedIdToken, name: decodedIdToken.email?.split('@')[0] };
    }
    
    const firestoreData = userDoc.data();

    // Combine Auth token data with Firestore data
    const userProfile = {
        ...decodedIdToken,
        ...firestoreData,
    };
    
    // In a real app with paid subscriptions, you would fetch the user's
    // subscription status from your database (e.g., Firestore) or check for
    // custom claims set by a backend process. For this prototype, we'll
    // add a mock custom claim to the decoded token to simulate a pro user.
    //
    // To test the "pro" state, you can uncomment the following line:
    // (userProfile as any).is_pro = true;

    return userProfile;
  } catch (error) {
    console.error("Error verifying session cookie or fetching user data:", error);
    return null;
  }
}
