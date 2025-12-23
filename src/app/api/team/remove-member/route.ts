import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { canRemoveMemberServer } from "@/lib/permissions.server";

/**
 * POST /api/team/remove-member
 * Remove a member from a workspace
 */
export async function POST(req: NextRequest) {
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

        // Parse request body
        const { workspaceId, memberUserId } = await req.json();

        if (!workspaceId || !memberUserId) {
            return NextResponse.json(
                { error: "Missing required fields: workspaceId, memberUserId" },
                { status: 400 }
            );
        }

        // Check if user has permission to remove this member
        const hasPermission = await canRemoveMemberServer(userId, workspaceId, memberUserId);
        if (!hasPermission) {
            return NextResponse.json(
                { error: "You don't have permission to remove this member" },
                { status: 403 }
            );
        }

        // Get member document
        const memberId = `${workspaceId}_${memberUserId}`;
        const memberDoc = await adminDb.doc(`workspace_members/${memberId}`).get();

        if (!memberDoc.exists) {
            return NextResponse.json(
                { error: "Member not found" },
                { status: 404 }
            );
        }

        const memberData = memberDoc.data();

        // Prevent removing owner
        if (memberData?.role === 'owner') {
            return NextResponse.json(
                { error: "Cannot remove workspace owner" },
                { status: 403 }
            );
        }

        // Update member status to removed
        await memberDoc.ref.update({
            status: 'removed',
        });

        // If removed user's current workspace is this one, clear it
        const userDoc = await adminDb.doc(`users/${memberUserId}`).get();
        if (userDoc.exists && userDoc.data()?.currentWorkspaceId === workspaceId) {
            // Find another workspace they're a member of
            const otherMemberships = await adminDb
                .collection("workspace_members")
                .where("userId", "==", memberUserId)
                .where("status", "==", "active")
                .limit(1)
                .get();

            const newWorkspaceId = otherMemberships.empty
                ? null
                : otherMemberships.docs[0].data().workspaceId;

            await adminDb.doc(`users/${memberUserId}`).update({
                currentWorkspaceId: newWorkspaceId,
            });
        }

        return NextResponse.json({
            success: true,
            message: "Member removed successfully",
        });
    } catch (error: any) {
        console.error("Error removing member:", error);
        return NextResponse.json(
            { error: error.message || "Failed to remove member" },
            { status: 500 }
        );
    }
}
