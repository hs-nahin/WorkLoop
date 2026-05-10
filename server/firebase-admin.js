const admin = require('firebase-admin');

if (!admin.apps.length) {
  if (!process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error("Missing FIREBASE_PRIVATE_KEY in environment variables");
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

  const config = {
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      private_key: privateKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    })
  };

  // Only add storageBucket if it's defined
  if (process.env.FIREBASE_STORAGE_BUCKET) {
    config.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  }

  admin.initializeApp(config);
}

let adminStorage = null;
try {
  adminStorage = admin.storage().bucket();
} catch (e) {
  console.warn('Firebase Storage not configured. File upload features will be unavailable.');
}

module.exports = {
  admin,
  adminAuth: admin.auth(),
  adminDb: admin.firestore(),
  adminStorage
};