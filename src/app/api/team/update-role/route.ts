import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { canChangeMemberRoleServer } from "@/lib/permissions.server";
import { WorkspaceRole } from "@/lib/firestore/workspaceTypes";

/**
 * POST /api/team/update-role
 * Update a member's role in a workspace
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
        const { workspaceId, memberUserId, newRole } = await req.json();

        if (!workspaceId || !memberUserId || !newRole) {
            return NextResponse.json(
                { error: "Missing required fields: workspaceId, memberUserId, newRole" },
                { status: 400 }
            );
        }

        // Validate new role
        if (newRole !== 'admin' && newRole !== 'member') {
            return NextResponse.json(
                { error: "Invalid role. Must be 'admin' or 'member'" },
                { status: 400 }
            );
        }

        // Check if user has permission to change roles
        const hasPermission = await canChangeMemberRoleServer(
            userId,
            workspaceId,
            memberUserId,
            newRole as WorkspaceRole
        );

        if (!hasPermission) {
            return NextResponse.json(
                { error: "You don't have permission to change member roles" },
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

        // Prevent changing owner role
        if (memberData?.role === 'owner') {
            return NextResponse.json(
                { error: "Cannot change owner role" },
                { status: 403 }
            );
        }

        // Update member role
        await memberDoc.ref.update({
            role: newRole,
        });

        return NextResponse.json({
            success: true,
            message: "Member role updated successfully",
            member: {
                userId: memberUserId,
                role: newRole,
            },
        });
    } catch (error: any) {
        console.error("Error updating member role:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update member role" },
            { status: 500 }
        );
    }
}
