'use server';

import { auth } from "firebase-admin";
import { cookies } from "next/headers";
import { getFirebaseAdminApp } from "./firebase-admin";

export async function getAuthenticatedUser() {
  getFirebaseAdminApp();
  const sessionCookie = cookies().get("session")?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedIdToken = await auth().verifySessionCookie(sessionCookie, true);
    
    // In a real app with paid subscriptions, you would fetch the user's
    // subscription status from your database (e.g., Firestore) or check for
    // custom claims set by a backend process. For this prototype, we'll
    // add a mock custom claim to the decoded token to simulate a pro user.
    //
    // To test the "pro" state, you can uncomment the following line:
    // (decodedIdToken as any).is_pro = true;

    return decodedIdToken;
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    return null;
  }
}
