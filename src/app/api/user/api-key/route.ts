import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { adminDb } from "@/lib/firebase/admin";
import { encrypt, decrypt } from "@/lib/encryption";
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

        const userDoc = await adminDb.collection("users").doc(userId).get();
        if (!userDoc.exists) {
            return NextResponse.json({ hasApiKey: false, maskedKey: null });
        }

        const userData = userDoc.data();

        let maskedKey = null;
        if (userData?.openaiApiKey) {
            try {
                const decrypted = decrypt(userData.openaiApiKey);
                if (decrypted && decrypted.length > 7) {
                    maskedKey = `${decrypted.slice(0, 3)}...${decrypted.slice(-4)}`;
                } else {
                    maskedKey = "sk-..."; // Fallback for weird keys
                }
            } catch (e) {
                console.error("Error decrypting key for mask:", e);
                // If we can't decrypt, we can't show a mask, but we know a key exists.
                // We might want to signal this state, but for now fallback to generic mask.
                maskedKey = "sk-...(error)";
            }
        }

        return NextResponse.json({
            hasApiKey: !!userData?.openaiApiKey,
            maskedKey
        });
    } catch (error) {
        console.error("Error checking API key:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
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

        const { apiKey } = await req.json();
        if (!apiKey || typeof apiKey !== "string" || !apiKey.startsWith("sk-")) {
            return NextResponse.json({ error: "Invalid API key format. Must start with 'sk-'." }, { status: 400 });
        }

        // 1. Verify Key with OpenAI
        try {
            const verifyRes = await fetch("https://api.openai.com/v1/models", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${apiKey}`
                }
            });

            if (!verifyRes.ok) {
                const errorData = await verifyRes.json().catch(() => ({}));
                console.error("OpenAI Verification Failed:", errorData);
                return NextResponse.json({
                    error: "Invalid API Key. OpenAI rejected this key."
                }, { status: 400 });
            }
        } catch (error) {
            console.error("Network error validating key:", error);
            // Decide if network error should block saving. Ideally yes to ensure validity.
            return NextResponse.json({ error: "Could not validate key. Check your connection or try again." }, { status: 502 });
        }

        // 2. Encrypt and Save
        const encryptedKey = encrypt(apiKey);

        await adminDb.collection("users").doc(userId).update({
            openaiApiKey: encryptedKey,
        });

        const maskedKey = `${apiKey.slice(0, 3)}...${apiKey.slice(-4)}`;

        return NextResponse.json({ success: true, maskedKey });
    } catch (error) {
        console.error("Error saving API key:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;

        // Remove the field from Firestore
        await adminDb.collection("users").doc(userId).update({
            openaiApiKey: FieldValue.delete(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting API key:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
