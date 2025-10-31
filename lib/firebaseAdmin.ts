import admin from "firebase-admin";

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
} else {
  console.error(
    "Firebase service account credentials not found. " +
      "Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH env variables."
  );
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized.");
  } catch (error) {
    console.error("Firebase Admin SDK initialization error:", error);
  }
}

// Export the auth and firestore services
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
