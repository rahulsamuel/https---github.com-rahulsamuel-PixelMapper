
'use server';

import * as admin from 'firebase-admin';
import { serviceAccount as rawServiceAccount } from '@/lib/firebase/service-account';

function getFirebaseAdminApp(): admin.app.App {
  if (admin.apps.length > 0 && admin.apps[0]) {
    return admin.apps[0];
  }

  const serviceAccount = {
    ...rawServiceAccount,
    privateKey: rawServiceAccount.privateKey.replace(/\\n/g, '\n'),
  };

  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error('Firebase service account credentials are not set correctly in src/lib/firebase/service-account.ts');
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function addData(collectionName: string, data: any) {
  try {
    const adminApp = getFirebaseAdminApp();
    const db = admin.firestore(adminApp);
    
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
