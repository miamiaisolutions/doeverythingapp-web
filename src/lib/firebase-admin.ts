
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export function initAdmin() {
    if (getApps().length === 0) {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            let serviceAccount;
            try {
                serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            } catch {
                // If it's not JSON, assume it's a file path (not implemented here for web config, usually env var is JSON string)
                console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON.");
            }

            if (serviceAccount) {
                initializeApp({
                    credential: cert(serviceAccount),
                });
            } else {
                initializeApp(); // Fallback to default google credentials
            }
        } else {
            initializeApp();
        }
    }
}

export { getFirestore };
