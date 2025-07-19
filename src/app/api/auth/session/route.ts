
import { getFirebaseAdminApp } from "@/lib/auth/firebase-admin";
import { auth } from "firebase-admin";
import { getApps } from "firebase-admin/app";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: "idToken is required" }, { status: 400 });
  }

  // Ensure Firebase Admin is initialized
  if (getApps().length === 0) {
    getFirebaseAdminApp();
    if (getApps().length === 0) {
      console.error("Firebase Admin SDK has not been initialized. Make sure your environment variables are set correctly for the admin SDK.");
      return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
    }
  }

  // Set session expiration to 5 days.
  const expiresIn = 60 * 60 * 24 * 5 * 1000;
  
  try {
    const sessionCookie = await auth().createSessionCookie(idToken, { expiresIn });
    
    cookies().set("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating session cookie:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 401 });
  }
}
