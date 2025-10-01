
'use server';

import admin from 'firebase-admin';
import { serviceAccount as rawServiceAccount } from '@/lib/firebase/service-account';

// Correctly format the service account credentials
const serviceAccount = {
  ...rawServiceAccount,
  privateKey: rawServiceAccount.privateKey.replace(/\\n/g, '\n'),
} as admin.ServiceAccount;

function getFirebaseAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }
  
  try {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    throw new Error("Failed to initialize Firebase Admin SDK. Please check your service account credentials.");
  }
}


export async function addData(collection: string, data: Record<string, any>) {
  try {
    const app = getFirebaseAdminApp();
    const db = admin.firestore(app);
    await db.collection(collection).add(data);
    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred during Firestore operation.";
    console.error(`Firestore 'addData' Error in collection '${collection}':`, error);
    return { success: false, error };
  }
}

export async function getData(collection: string, orderBy?: string) {
    try {
        const app = getFirebaseAdminApp();
        const db = admin.firestore(app);
        
        let query: admin.firestore.Query<admin.firestore.DocumentData> = db.collection(collection);

        if (orderBy) {
            query = query.orderBy(orderBy);
        }

        const snapshot = await query.get();
        
        if (snapshot.empty) {
            return { data: [], error: null };
        }

        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { data, error: null };

    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred during Firestore operation.";
        console.error(`Firestore 'getData' Error in collection '${collection}':`, error);
        return { data: [], error };
    }
}

export async function getDataById(collection: string, docId: string) {
  try {
    const app = getFirebaseAdminApp();
    const db = admin.firestore(app);
    const docRef = db.collection(collection).doc(docId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return { data: null, error: 'Document not found.' };
    }

    return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error(`Firestore 'getDataById' Error in collection '${collection}':`, error);
    return { data: null, error };
  }
}

export async function updateData(collection: string, docId: string, data: Record<string, any>) {
  try {
    const app = getFirebaseAdminApp();
    const db = admin.firestore(app);
    await db.collection(collection).doc(docId).update(data);
    return { success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error(`Firestore 'updateData' Error in collection '${collection}':`, error);
    return { success: false, error };
  }
}


export async function deleteData(collection: string, docId: string) {
    try {
        const app = getFirebaseAdminApp();
        const db = admin.firestore(app);
        await db.collection(collection).doc(docId).delete();
        return { success: true };
    } catch (e) {
        const error = e instanceof Error ? e.message : "An unknown error occurred during Firestore operation.";
        console.error(`Firestore 'deleteData' Error in collection '${collection}':`, error);
        return { success: false, error };
    }
}
