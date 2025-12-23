import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { User } from "./types";

export async function getUser(userId: string): Promise<User | null> {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) return null;
    return userDoc.data() as User;
}

export async function createUser(
    userId: string,
    data: {
        email: string;
        name?: string;
        phoneNumber?: string;
        avatarUrl?: string;
    }
): Promise<void> {
    await setDoc(doc(db, "users", userId), {
        ...data,
        createdAt: Timestamp.now(),
    });
}

export async function updateUser(
    userId: string,
    data: Partial<User>
): Promise<void> {
    await updateDoc(doc(db, "users", userId), data);
}

export async function updateUserOpenAIKey(
    userId: string,
    encryptedKey: string
): Promise<void> {
    await updateDoc(doc(db, "users", userId), {
        openaiApiKey: encryptedKey,
    });
}
