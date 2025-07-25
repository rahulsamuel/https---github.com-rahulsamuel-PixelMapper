
'use server';

import { getFirebaseAdminApp } from '@/lib/auth/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

export async function addData(collectionName: string, data: any) {
  try {
    const adminApp = getFirebaseAdminApp();
    const db = getFirestore(adminApp);
    
    const docRef = await db.collection(collectionName).add({
      ...data,
      createdAt: new Date(),
    });
    
    return { id: docRef.id, error: null };
  } catch (e) {
    console.error("Error adding document: ", e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    return { id: null, error: errorMessage };
  }
}
