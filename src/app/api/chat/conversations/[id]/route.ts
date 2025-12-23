import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;
        const { id } = await params;

        // Verify ownership
        const conversationRef = adminDb
            .collection("users")
            .doc(userId)
            .collection("conversations")
            .doc(id);

        const conversationDoc = await conversationRef.get();
        if (!conversationDoc.exists) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
        }

        // Fetch messages
        const messagesSnapshot = await conversationRef
            .collection("messages")
            .orderBy("createdAt", "asc")
            .get();

        const messages = messagesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString(),
        }));

        return NextResponse.json({ messages });
    } catch (error) {
        console.error("Error fetching conversation:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;
        const { id } = await params;

        // Verify ownership and delete
        // Note: Subcollections (messages) are NOT automatically deleted in Firestore.
        // For v1, we'll just delete the parent doc. The subcollection remains orphaned but inaccessible.
        // In a production app, we should use a recursive delete function.

        await adminDb
            .collection("users")
            .doc(userId)
            .collection("conversations")
            .doc(id)
            .delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting conversation:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;
        const { id } = await params;
        const { title } = await req.json();

        if (!title || typeof title !== "string") {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        const conversationRef = adminDb
            .collection("users")
            .doc(userId)
            .collection("conversations")
            .doc(id);

        const conversationDoc = await conversationRef.get();
        if (!conversationDoc.exists) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
        }

        await conversationRef.update({
            title,
            updatedAt: new Date(),
        });

        return NextResponse.json({ success: true, title });
    } catch (error) {
        console.error("Error updating conversation:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
