import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { decrypt } from "@/lib/encryption";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate User
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const uid = decodedToken.uid;

        // 2. Get User's OpenAI Key
        // 2. Get User's OpenAI Key
        const userDoc = await adminDb.collection("users").doc(uid).get();

        if (!userDoc.exists) {
            return NextResponse.json({ error: "User profile not found" }, { status: 400 });
        }

        const userData = userDoc.data();
        const encryptedKey = userData?.openaiApiKey;

        if (!encryptedKey) {
            return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 400 });
        }

        let apiKey: string;
        try {
            apiKey = decrypt(encryptedKey);
        } catch (error) {
            console.error("Decryption failed:", error);
            return NextResponse.json({ error: "Failed to decrypt API key" }, { status: 500 });
        }

        // 3. Process Audio File
        const formData = await req.formData();
        const audioFile = formData.get("file") as unknown as File;

        if (!audioFile) {
            return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
        }

        // 4. Call OpenAI Whisper
        const openai = new OpenAI({ apiKey });

        // We need to pass a File object to OpenAI. 
        // The FormData file from Next.js is compatible at runtime, but TypeScript definitions 
        // between Node's Buffer-based File and the Web File API can conflict.
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile as any,
            model: "whisper-1",
        });

        return NextResponse.json({ text: transcription.text });

    } catch (error: any) {
        console.error("Transcription error:", error);
        return NextResponse.json({
            error: error.message || "Internal Server Error"
        }, { status: 500 });
    }
}
