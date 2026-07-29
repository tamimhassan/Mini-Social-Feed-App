import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

let initialized = false;

function initFirebase(): typeof admin {
  if (initialized) return admin;

  let credential: admin.credential.Credential | null = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      ) as admin.ServiceAccount;
      credential = admin.credential.cert(serviceAccount);
    } catch (err) {
      console.error(
        'Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:',
        (err as Error).message,
      );
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const resolvedPath = path.resolve(
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    );
    if (fs.existsSync(resolvedPath)) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(resolvedPath, 'utf8'),
      ) as admin.ServiceAccount;
      credential = admin.credential.cert(serviceAccount);
    }
  }

  if (credential) {
    admin.initializeApp({ credential });
    initialized = true;
    console.log('Firebase Admin initialized - push notifications enabled.');
  } else {
    console.warn(
      'Firebase Admin NOT initialized (no service account configured). ' +
        'Push notifications will be skipped, but the API will still function.',
    );
  }

  return admin;
}

function isInitialized(): boolean {
  return initialized;
}

export { admin, initFirebase, isInitialized };
