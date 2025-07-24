
import { getFirebaseAdminApp } from "@/lib/auth/firebase-admin";
import { auth } from "firebase-admin";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { idToken } = await request.json();

  if (!idToken) {
    return NextResponse.json({ error: "idToken is required" }, { status: 400 });
  }

  try {
    // Ensure Firebase Admin is initialized. This will throw if config is missing.
    getFirebaseAdminApp();
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization failed:", error.message);
    return NextResponse.json({ 
      error: "Server configuration error. Firebase Admin SDK not initialized.",
      details: error.message,
    }, { status: 500 });
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
