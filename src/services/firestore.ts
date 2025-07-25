
'use server';

import { adminDb } from '@/lib/firebase/admin';

export async function addData(collectionName: string, data: any) {
  try {
    const docRef = await adminDb.collection(collectionName).add({
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
