import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

/**
 * GET /api/team/members?workspaceId=xxx
 * Get all members of a workspace
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

        // Get workspaceId from query params
        const { searchParams } = new URL(req.url);
        const workspaceId = searchParams.get("workspaceId");

        if (!workspaceId) {
            return NextResponse.json(
                { error: "Missing workspaceId parameter" },
                { status: 400 }
            );
        }

        // Check if user is a member of the workspace
        const userMemberId = `${workspaceId}_${userId}`;
        const userMemberDoc = await adminDb.doc(`workspace_members/${userMemberId}`).get();

        if (!userMemberDoc.exists || userMemberDoc.data()?.status !== 'active') {
            return NextResponse.json(
                { error: "You are not a member of this workspace" },
                { status: 403 }
            );
        }

        // Get all active members
        const membersSnapshot = await adminDb
            .collection("workspace_members")
            .where("workspaceId", "==", workspaceId)
            .where("status", "==", "active")
            .get();

        // Fetch user details for each member
        const members = await Promise.all(
            membersSnapshot.docs.map(async (doc) => {
                const memberData = doc.data();
                const userDoc = await adminDb.doc(`users/${memberData.userId}`).get();
                const userData = userDoc.data();

                return {
                    id: memberData.id,
                    userId: memberData.userId,
                    role: memberData.role,
                    invitedAt: memberData.invitedAt.toDate().toISOString(),
                    joinedAt: memberData.joinedAt?.toDate().toISOString(),
                    user: userData ? {
                        email: userData.email,
                        name: userData.name,
                        avatarUrl: userData.avatarUrl,
                    } : null,
                };
            })
        );

        // Get pending invites
        const invitesSnapshot = await adminDb
            .collection("workspace_invites")
            .where("workspaceId", "==", workspaceId)
            .where("status", "==", "pending")
            .get();

        const invites = invitesSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: data.id,
                email: data.email,
                role: data.role,
                invitedBy: data.invitedBy,
                createdAt: data.createdAt.toDate().toISOString(),
                expiresAt: data.expiresAt.toDate().toISOString(),
            };
        });

        return NextResponse.json({
            success: true,
            members,
            invites,
        });
    } catch (error: any) {
        console.error("Error fetching members:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch members" },
            { status: 500 }
        );
    }
}
