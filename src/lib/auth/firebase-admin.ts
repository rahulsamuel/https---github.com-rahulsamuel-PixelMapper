
import * as admin from 'firebase-admin';
import { serviceAccount } from '@/lib/firebase/service-account';

/**
 * Returns the Firebase Admin app instance, initializing it if necessary.
 * This function is robust against multiple calls and ensures that the app is
 * initialized only once.
 *
 * @returns {admin.app.App} The initialized Firebase Admin app.
 * @throws {Error} If the Firebase Admin SDK environment variables are not set.
 */
export function getFirebaseAdminApp(): admin.app.App {
  // Check if the required environment variables are set.
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error('Firebase service account credentials are not set in src/lib/firebase/service-account.ts');
  }

  // If the app is already initialized, return it.
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  // Initialize the app with the service account credentials.
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
