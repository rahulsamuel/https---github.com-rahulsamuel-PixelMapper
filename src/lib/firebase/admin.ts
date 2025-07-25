
// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';
import { serviceAccount as rawServiceAccount } from './service-account';

let app: admin.app.App;

function getFirebaseAdminApp(): admin.app.App {
  if (app) {
    return app;
  }

  if (admin.apps.length > 0 && admin.apps[0]) {
    return (app = admin.apps[0]);
  }

  const serviceAccount = {
    ...rawServiceAccount,
    privateKey: rawServiceAccount.privateKey.replace(/\\n/g, '\n'),
  };

  if (
    !serviceAccount.projectId ||
    !serviceAccount.clientEmail ||
    !serviceAccount.privateKey
  ) {
    throw new Error(
      'Firebase service account credentials are not set correctly in src/lib/firebase/service-account.ts'
    );
  }

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return app;
}

export const adminDb = admin.firestore(getFirebaseAdminApp());
