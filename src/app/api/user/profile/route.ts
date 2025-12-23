import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

/**
 * GET /api/user/profile
 * Get current user's profile including current workspace
 */
export async function GET(req: NextRequest) {
    try {
        // Verify authentication
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;

        // Get user document
        const userDoc = await adminDb.doc(`users/${userId}`).get();

        if (!userDoc.exists) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const userData = userDoc.data();

        return NextResponse.json({
            success: true,
            currentWorkspaceId: userData?.currentWorkspaceId || null,
            email: userData?.email,
            name: userData?.name,
            avatarUrl: userData?.avatarUrl,
        });
    } catch (error: any) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch user profile" },
            { status: 500 }
        );
    }
}
