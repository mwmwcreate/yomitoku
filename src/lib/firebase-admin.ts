import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Replace escaped newlines if they exist in the env variable
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      console.warn('Firebase admin initialization skipped: Missing environment variables');
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

// Return a dummy object if app is not initialized to prevent build crash
const db = admin.apps.length > 0 ? admin.firestore() : {} as FirebaseFirestore.Firestore;

export { db };
