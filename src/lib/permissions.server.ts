import { adminDb } from "@/lib/firebase/admin";
import { WorkspaceRole } from "@/lib/firestore/workspaceTypes";

/**
 * Server-side permission utilities for API routes
 * Uses Firebase Admin SDK instead of client SDK
 */

/**
 * Get user's role in workspace (server-side)
 */
export async function getMemberRoleServer(
    workspaceId: string,
    userId: string
): Promise<WorkspaceRole | null> {
    const memberId = `${workspaceId}_${userId}`;
    const memberDoc = await adminDb.doc(`workspace_members/${memberId}`).get();

    if (!memberDoc.exists) return null;

    const member = memberDoc.data();
    if (member?.status !== 'active') return null;

    return member.role as WorkspaceRole;
}

/**
 * Check if user is a member of workspace (server-side)
 */
export async function isWorkspaceMemberServer(
    workspaceId: string,
    userId: string
): Promise<boolean> {
    const role = await getMemberRoleServer(workspaceId, userId);
    return role !== null;
}

/**
 * Check if user is owner (server-side)
 */
export async function isOwnerServer(
    userId: string,
    workspaceId: string
): Promise<boolean> {
    const role = await getMemberRoleServer(workspaceId, userId);
    return role === 'owner';
}

/**
 * Check if user is owner or admin (server-side)
 */
export async function isOwnerOrAdminServer(
    userId: string,
    workspaceId: string
): Promise<boolean> {
    const role = await getMemberRoleServer(workspaceId, userId);
    return role === 'owner' || role === 'admin';
}

/**
 * Check if user can manage team (server-side)
 */
export async function canManageTeamServer(
    userId: string,
    workspaceId: string
): Promise<boolean> {
    return isOwnerOrAdminServer(userId, workspaceId);
}

/**
 * Check if user can manage billing (server-side)
 */
export async function canManageBillingServer(
    userId: string,
    workspaceId: string
): Promise<boolean> {
    return isOwnerOrAdminServer(userId, workspaceId);
}

/**
 * Check if user can remove a specific member (server-side)
 */
export async function canRemoveMemberServer(
    userId: string,
    workspaceId: string,
    targetUserId: string
): Promise<boolean> {
    const userRole = await getMemberRoleServer(workspaceId, userId);
    const targetRole = await getMemberRoleServer(workspaceId, targetUserId);

    if (!userRole || !targetRole) return false;

    // Cannot remove owner
    if (targetRole === 'owner') return false;

    // Owner can remove anyone (except another owner)
    if (userRole === 'owner') return true;

    // Admin can only remove members, not other admins or owner
    if (userRole === 'admin' && targetRole === 'member') return true;

    return false;
}

/**
 * Check if user can change a member's role (server-side)
 */
export async function canChangeMemberRoleServer(
    userId: string,
    workspaceId: string,
    targetUserId: string,
    newRole: WorkspaceRole
): Promise<boolean> {
    const userRole = await getMemberRoleServer(workspaceId, userId);
    const targetRole = await getMemberRoleServer(workspaceId, targetUserId);

    if (!userRole || !targetRole) return false;

    // Only owner can change roles
    if (userRole !== 'owner') return false;

    // Cannot change owner role
    if (targetRole === 'owner' || newRole === 'owner') return false;

    return true;
}

/**
 * Check if workspace has reached member limit (server-side)
 */
export async function isAtMemberLimitServer(workspaceId: string): Promise<boolean> {
    const workspaceDoc = await adminDb.doc(`workspaces/${workspaceId}`).get();
    if (!workspaceDoc.exists) return true;

    const workspace = workspaceDoc.data();
    if (!workspace) return true;

    // Count active members
    const membersSnapshot = await adminDb
        .collection("workspace_members")
        .where("workspaceId", "==", workspaceId)
        .where("status", "==", "active")
        .get();

    return membersSnapshot.size >= workspace.maxMembers;
}

/**
 * Check if email has pending invite (server-side)
 */
export async function hasPendingInviteServer(
    workspaceId: string,
    email: string
): Promise<boolean> {
    const invitesSnapshot = await adminDb
        .collection("workspace_invites")
        .where("workspaceId", "==", workspaceId)
        .where("email", "==", email)
        .where("status", "==", "pending")
        .get();

    return !invitesSnapshot.empty;
}
