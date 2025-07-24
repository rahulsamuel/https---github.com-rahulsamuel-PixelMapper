
'use server';

import { db } from '@/lib/firebase/client';
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
        const q = query(collection(db, collectionName), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
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
