
import * as admin from 'firebase-admin';

// The key is to use these specific names for the environment variables, as the
// a hosting provider like Vercel will automatically recognize them.
// The values for these variables can be found in the service account JSON file
// that you can download from the Firebase console.
const serviceAccount: admin.ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // The private key needs to be parsed correctly, especially with the newline characters.
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

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
    throw new Error('Firebase Admin SDK environment variables are not set.');
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
