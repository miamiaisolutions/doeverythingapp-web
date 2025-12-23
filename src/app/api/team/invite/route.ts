import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { canManageTeamServer, isAtMemberLimitServer, hasPendingInviteServer } from "@/lib/permissions.server";
import { Timestamp } from "firebase-admin/firestore";

/**
 * POST /api/team/invite
 * Create a team invitation
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
        const { workspaceId, email, role } = await req.json();

        // Validate inputs
        if (!workspaceId || !email || !role) {
            return NextResponse.json(
                { error: "Missing required fields: workspaceId, email, role" },
                { status: 400 }
            );
        }

        if (role !== 'admin' && role !== 'member') {
            return NextResponse.json(
                { error: "Invalid role. Must be 'admin' or 'member'" },
                { status: 400 }
            );
        }

        // Check if user has permission to invite members
        const hasPermission = await canManageTeamServer(userId, workspaceId);
        if (!hasPermission) {
            return NextResponse.json(
                { error: "You don't have permission to invite members" },
                { status: 403 }
            );
        }

        // Check if workspace is at member limit
        const atLimit = await isAtMemberLimitServer(workspaceId);
        if (atLimit) {
            return NextResponse.json(
                { error: "Workspace has reached maximum member limit. Please upgrade your plan." },
                { status: 403 }
            );
        }

        // Check if email already has pending invite
        const alreadyInvited = await hasPendingInviteServer(workspaceId, email);
        if (alreadyInvited) {
            return NextResponse.json(
                { error: "This email already has a pending invitation" },
                { status: 400 }
            );
        }

        // Check if user with this email is already a member
        const usersSnapshot = await adminDb
            .collection("users")
            .where("email", "==", email)
            .limit(1)
            .get();

        if (!usersSnapshot.empty) {
            const invitedUserId = usersSnapshot.docs[0].id;
            const memberDoc = await adminDb
                .doc(`workspace_members/${workspaceId}_${invitedUserId}`)
                .get();

            if (memberDoc.exists && memberDoc.data()?.status === 'active') {
                return NextResponse.json(
                    { error: "This user is already a member of the workspace" },
                    { status: 400 }
                );
            }
        }

        // Create invite using client SDK functions (need to adapt for admin)
        const inviteRef = adminDb.collection("workspace_invites").doc();
        const token_invite = generateInviteToken();

        // Invites expire after 7 days
        const expiresAt = Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const invite = {
            id: inviteRef.id,
            workspaceId,
            email,
            role,
            invitedBy: userId,
            token: token_invite,
            expiresAt,
            createdAt: Timestamp.now(),
            status: 'pending',
        };

        await inviteRef.set(invite);

        // TODO: Send invitation email
        // await sendInvitationEmail(email, workspaceId, token_invite);

        return NextResponse.json({
            success: true,
            invite: {
                id: invite.id,
                email: invite.email,
                role: invite.role,
                expiresAt: invite.expiresAt.toDate().toISOString(),
            },
        });
    } catch (error: any) {
        console.error("Error creating invite:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create invitation" },
            { status: 500 }
        );
    }
}

/**
 * Generate a secure invite token
 */
/**
 * Generate a secure invite token
 */
function generateInviteToken(): string {
    return crypto.randomUUID().replace(/-/g, '');
}
