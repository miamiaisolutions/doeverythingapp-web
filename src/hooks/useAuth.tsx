"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { User } from "@/lib/firestore/types";

// Extend our Firestore User type with Firebase Auth properties if needed, 
// or just use a combined type. For now, let's expose the Firestore User 
// plus the uid from Firebase.
export type AuthUser = User & { uid: string; emailVerified: boolean };

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    firebaseUser: FirebaseUser | null; // Keep access to raw Firebase user if needed
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    firebaseUser: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeFirestore: (() => void) | null = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
            setFirebaseUser(authUser);

            // Cleanup previous firestore subscription if exists
            if (unsubscribeFirestore) {
                unsubscribeFirestore();
                unsubscribeFirestore = null;
            }

            if (authUser) {
                // Subscribe to the user's Firestore document
                const userDocRef = doc(db, "users", authUser.uid);
                unsubscribeFirestore = onSnapshot(userDocRef, (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const userData = docSnapshot.data() as User;
                        setUser({
                            ...userData,
                            uid: authUser.uid,
                            emailVerified: authUser.emailVerified
                        });
                    } else {
                        console.warn("User authenticated but no Firestore profile found.");
                        setUser(null);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Firestore user sync error:", error);
                    // Don't set loading false here, as we might still be auth'd
                });
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            if (unsubscribeFirestore) {
                unsubscribeFirestore();
            }
            unsubscribeAuth();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, firebaseUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
