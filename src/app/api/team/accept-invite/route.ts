import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

/**
 * POST /api/team/accept-invite
 * Accept a workspace invitation
 */
export const dynamic = 'force-dynamic';

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
        const { inviteToken } = await req.json();

        if (!inviteToken) {
            return NextResponse.json(
                { error: "Missing invite token" },
                { status: 400 }
            );
        }

        // Find invite by token
        const invitesSnapshot = await adminDb
            .collection("workspace_invites")
            .where("token", "==", inviteToken)
            .where("status", "==", "pending")
            .limit(1)
            .get();

        if (invitesSnapshot.empty) {
            return NextResponse.json(
                { error: "Invalid or expired invitation" },
                { status: 404 }
            );
        }

        const inviteDoc = invitesSnapshot.docs[0];
        const invite = inviteDoc.data();

        // Check if expired
        if (invite.expiresAt.toMillis() < Date.now()) {
            await inviteDoc.ref.update({ status: 'expired' });
            return NextResponse.json(
                { error: "This invitation has expired" },
                { status: 400 }
            );
        }

        // Get user's email to verify it matches invite
        const userDoc = await adminDb.doc(`users/${userId}`).get();
        const userData = userDoc.data();

        if (!userData || userData.email !== invite.email) {
            return NextResponse.json(
                { error: "This invitation was sent to a different email address" },
                { status: 403 }
            );
        }

        // Check if user is already a member
        const memberId = `${invite.workspaceId}_${userId}`;
        const existingMember = await adminDb.doc(`workspace_members/${memberId}`).get();

        if (existingMember.exists && existingMember.data()?.status === 'active') {
            return NextResponse.json(
                { error: "You are already a member of this workspace" },
                { status: 400 }
            );
        }

        // Check workspace member limit
        const workspaceDoc = await adminDb.doc(`workspaces/${invite.workspaceId}`).get();
        const workspace = workspaceDoc.data();

        if (!workspace) {
            return NextResponse.json(
                { error: "Workspace not found" },
                { status: 404 }
            );
        }

        // Count active members
        const membersSnapshot = await adminDb
            .collection("workspace_members")
            .where("workspaceId", "==", invite.workspaceId)
            .where("status", "==", "active")
            .get();

        if (membersSnapshot.size >= workspace.maxMembers) {
            return NextResponse.json(
                { error: "Workspace has reached maximum member limit" },
                { status: 403 }
            );
        }

        // Create workspace member
        const member = {
            id: memberId,
            workspaceId: invite.workspaceId,
            userId,
            role: invite.role,
            invitedBy: invite.invitedBy,
            invitedAt: invite.createdAt,
            joinedAt: Timestamp.now(),
            status: 'active',
        };

        await adminDb.doc(`workspace_members/${memberId}`).set(member);

        // Update invite status
        await inviteDoc.ref.update({ status: 'accepted' });

        // Update user's current workspace if not set
        if (!userData.currentWorkspaceId) {
            await adminDb.doc(`users/${userId}`).update({
                currentWorkspaceId: invite.workspaceId,
            });
        }

        return NextResponse.json({
            success: true,
            workspace: {
                id: invite.workspaceId,
                role: invite.role,
            },
        });
    } catch (error: any) {
        console.error("Error accepting invite:", error);
        return NextResponse.json(
            { error: error.message || "Failed to accept invitation" },
            { status: 500 }
        );
    }
}
