
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import type { ServiceAccount } from "firebase-admin";

const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`ERROR: The following environment variables are missing: ${missingEnvVars.join(', ')}`);
  console.error('Please add them to your .env file to initialize Firebase Admin.');
}

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID!,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

export function getFirebaseAdminApp() {
  if (missingEnvVars.length > 0) {
    // Return a mock or minimal app object if env vars are missing
    // This prevents the app from crashing during build or startup
    return {
      auth: () => ({
        verifySessionCookie: () => Promise.reject(new Error("Firebase Admin not initialized.")),
      }),
    };
  }

  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
}
