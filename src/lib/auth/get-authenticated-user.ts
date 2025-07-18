
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
    return decodedIdToken;
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    return null;
  }
}
