
'use server';

import { db } from '@/lib/firebase/client';
import { getFirebaseAdminApp } from '@/lib/auth/firebase-admin';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from 'firebase/firestore';

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

export async function getData(collectionName: string) {
    try {
        const adminApp = getFirebaseAdminApp();
        const adminDb = getAdminFirestore(adminApp);
        const q = adminDb.collection(collectionName).orderBy('timestamp', 'desc');
        const querySnapshot = await q.get();
        const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { data, error: null };
    } catch (e) {
        console.error("Error getting documents: ", e);
        return { data: [], error: e };
    }
}
