import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!getApps().length) {
    if (serviceAccountKey) {
        try {
            // Support both file path and JSON string for service account
            let serviceAccount;
            if (serviceAccountKey.startsWith("{")) {
                serviceAccount = JSON.parse(serviceAccountKey);
            } else {
                // If it's a path, we assume it's handled by the environment or loaded elsewhere,
                // but for simplicity in this setup we'll focus on JSON string or standard init.
                // If no cert is provided, it falls back to Google Application Default Credentials
                // which is often preferred in cloud environments.
                serviceAccount = require(serviceAccountKey);
            }

            initializeApp({
                credential: cert(serviceAccount),
            });
        } catch (error) {
            console.error("Firebase Admin initialization error:", error);
        }
    } else {
        // Fallback to default credentials (useful for hosting on GCP/Firebase)
        initializeApp();
    }
}

const adminApp = getApp();
const adminDb = getFirestore(adminApp);
const adminAuth = getAuth(adminApp);

export { adminApp, adminDb, adminAuth };
