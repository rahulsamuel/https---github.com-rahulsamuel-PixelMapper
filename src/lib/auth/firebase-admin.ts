
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { ServiceAccount } from "firebase-admin";

const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

let adminDb: ReturnType<typeof getFirestore> | null = null;

export function getFirebaseAdminApp() {
  if (missingEnvVars.length > 0) {
    console.error(`ERROR: The following environment variables are missing: ${missingEnvVars.join(', ')}`);
    console.error('Please add them to your .env file to initialize Firebase Admin.');
    return null;
  }
  
  const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };


  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

export function getAdminDb() {
  const app = getFirebaseAdminApp();
  if (!app) {
    return null;
  }
  if (!adminDb) {
    adminDb = getFirestore(app);
  }
  return adminDb;
}
