// import admin from "firebase-admin";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import fs from "fs";

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  const serviceAccountPath = path.resolve(
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  );
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccountFile = fs.readFileSync(serviceAccountPath, "utf-8");
    serviceAccount = JSON.parse(serviceAccountFile);
  } else {
    console.error(
      `Service account file not found at path: ${serviceAccountPath}`,
    );
  }
} else {
  console.error(
    "Firebase service account credentials not found. " +
      "Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH env variables.",
  );
}

if (getApps().length == 0) {
  try {
    initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    console.error("Firebase Admin SDK initialization error:", error);
  }
}

// Export the auth and firestore services
export const adminAuth = getAuth();
export const adminDb = getFirestore();
