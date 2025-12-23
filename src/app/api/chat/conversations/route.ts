import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;

        const snapshot = await adminDb
            .collection("users")
            .doc(userId)
            .collection("conversations")
            .orderBy("updatedAt", "desc")
            .limit(20)
            .get();

        const conversations = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            // Convert timestamps to ISO strings for JSON serialization
            createdAt: doc.data().createdAt?.toDate().toISOString(),
            updatedAt: doc.data().updatedAt?.toDate().toISOString(),
        }));

        return NextResponse.json({ conversations });
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;

        const { title } = await req.json().catch(() => ({}));

        const docRef = await adminDb
            .collection("users")
            .doc(userId)
            .collection("conversations")
            .add({
                title: title || "New Chat",
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            });

        return NextResponse.json({ id: docRef.id });
    } catch (error) {
        console.error("Error creating conversation:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
