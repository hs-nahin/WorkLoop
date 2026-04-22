const admin = require('firebase-admin');

if (!admin.apps.length) {
  if (!process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error("Missing FIREBASE_PRIVATE_KEY in environment variables");
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      private_key: privateKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
}

module.exports = {
  admin,
  adminAuth: admin.auth(),
  adminDb: admin.firestore(),
  adminStorage: admin.storage().bucket()
};