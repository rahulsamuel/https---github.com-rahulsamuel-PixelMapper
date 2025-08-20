
'use server';

import * as admin from 'firebase-admin';
import { serviceAccount as rawServiceAccount } from '@/lib/firebase/service-account';

let app: admin.app.App;

function getFirebaseAdminApp(): admin.app.App {
  if (app) {
    return app;
  }

  const serviceAccount = {
    ...rawServiceAccount,
    privateKey: rawServiceAccount.privateKey.replace(/\\n/g, '\n'),
  };

  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error('Firebase service account credentials are not set or incomplete in src/lib/firebase/service-account.ts');
  }

  if (admin.apps.length > 0) {
    app = admin.apps[0]!;
    return app;
  }

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return app;
}


export async function addData(collection: string, data: object) {
  try {
    const db = getFirebaseAdminApp().firestore();
    const docRef = await db.collection(collection).add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { id: docRef.id, error: null };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred during Firestore operation.";
    console.error(`Firestore 'addData' Error in collection '${collection}':`, error);
    return { id: null, error };
  }
}

export async function getData(collection: string) {
    try {
        const db = getFirebaseAdminApp().firestore();
        const snapshot = await db.collection(collection).orderBy('timestamp', 'desc').get();
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
