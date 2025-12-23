import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

export async function POST() {
    try {
        // Generate a unique guest ID
        const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Create a custom token for this guest
        const customToken = await adminAuth.createCustomToken(guestId, {
            role: "guest",
            isAnonymous: true
        });

        return NextResponse.json({ token: customToken });
    } catch (error: any) {
        console.error("Error creating custom token:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create guest session" },
            { status: 500 }
        );
    }
}
