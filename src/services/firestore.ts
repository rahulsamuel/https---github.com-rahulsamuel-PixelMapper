
import * as admin from 'firebase-admin';
import { serviceAccount } from '@/lib/firebase/service-account';

// This function initializes and returns the Firebase Admin app instance.
// It ensures the app is initialized only once.
function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // The service account private key needs to have its newlines correctly formatted.
  const privateKey = serviceAccount.privateKey.replace(/\\n/g, '\n');
  
  const credentials = {
    ...serviceAccount,
    privateKey,
  };

  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert(credentials),
    });
    return app;
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    throw new Error("Failed to initialize Firebase Admin SDK. Please check your service account credentials.");
  }
}

// Adds a new document to the specified collection in Firestore.
export async function addData(collection: string, data: any) {
  try {
    const app = initializeAdminApp();
    const db = admin.firestore(app);
    await db.collection(collection).add(data);
    return { error: null };
  } catch (error: any) {
    console.error('Firestore addData error:', error);
    return { error: error.message || 'An unknown Firestore error occurred.' };
  }
}

// Fetches all documents from a specified collection in Firestore.
export async function getData(collection: string) {
  try {
    const app = initializeAdminApp();
    const db = admin.firestore(app);
    const snapshot = await db.collection(collection).get();
    
    if (snapshot.empty) {
      return { data: [], error: null };
    }

    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { data, error: null };
  } catch (error: any) {
    console.error('Firestore getData error:', error);
    return { data: null, error: error.message || 'An unknown Firestore error occurred.' };
  }
}
