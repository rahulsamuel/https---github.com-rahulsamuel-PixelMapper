
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { ServiceAccount } from "firebase-admin";

let adminDb: ReturnType<typeof getFirestore> | null = null;

export function getFirebaseAdminApp() {
  const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
  ];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    throw new Error(`Missing Firebase Admin SDK environment variables: ${missingEnvVars.join(', ')}. Please set them in your .env file.`);
  }

  if (getApps().length > 0) {
    return getApp();
  }
  
  const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

export function getAdminDb() {
  try {
    const app = getFirebaseAdminApp();
    if (!adminDb) {
      adminDb = getFirestore(app);
    }
    return adminDb;
  } catch (error) {
    // If admin app fails to initialize (e.g., missing env vars), return null
    return null;
  }
}
