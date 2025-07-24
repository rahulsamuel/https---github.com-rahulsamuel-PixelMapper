
'use server';

import { db } from '@/lib/firebase/client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function addData(collectionName: string, data: any) {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, error: null };
  } catch (e) {
    console.error("Error adding document: ", e);
    return { id: null, error: e };
  }
}
