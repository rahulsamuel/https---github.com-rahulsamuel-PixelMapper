
'use server';

import { getFirebaseAdminApp } from '@/lib/auth/firebase-admin';

export async function addData(collectionName: string, data: any) {
  try {
    const adminApp = getFirebaseAdminApp();
    const db = adminApp.firestore();
    
    const docRef = await db.collection(collectionName).add({
      ...data,
      createdAt: new Date().toISOString(),
    });
    
    return { id: docRef.id, error: null };
  } catch (e) {
    console.error("Error adding document: ", e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    return { id: null, error: errorMessage };
  }
}

