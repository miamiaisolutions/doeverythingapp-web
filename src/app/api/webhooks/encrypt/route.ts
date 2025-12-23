import { NextRequest, NextResponse } from "next/server";
import { encrypt } from "@/lib/encryption";
import { getAuth } from "firebase-admin/auth";
import { adminApp } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
    try {
        // Authenticate User
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const idToken = authHeader.split("Bearer ")[1];
        await getAuth(adminApp).verifyIdToken(idToken);

        // Get value to encrypt
        const body = await req.json();
        const { value } = body;

        if (!value || typeof value !== "string") {
            return NextResponse.json({ error: "Invalid value provided" }, { status: 400 });
        }

        const encrypted = encrypt(value);

        return NextResponse.json({ encrypted });
    } catch (error) {
        console.error("Encryption error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
