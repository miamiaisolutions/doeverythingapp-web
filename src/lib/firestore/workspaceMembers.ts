import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
    Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { WorkspaceMember, WorkspaceRole, WorkspaceMemberWithUser } from "./workspaceTypes";
import { getUser } from "./users";

/**
 * Add a member to a workspace
 */
export async function addMember(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
    invitedBy: string
): Promise<WorkspaceMember> {
    const memberId = `${workspaceId}_${userId}`;
    const member: WorkspaceMember = {
        id: memberId,
        workspaceId,
        userId,
        role,
        invitedBy,
        invitedAt: Timestamp.now(),
        joinedAt: Timestamp.now(),
        status: 'active',
    };

    await setDoc(doc(db, "workspace_members", memberId), member);
    return member;
}

/**
 * Remove a member from a workspace
 */
export async function removeMember(
    workspaceId: string,
    userId: string
): Promise<void> {
    const memberId = `${workspaceId}_${userId}`;
    await updateDoc(doc(db, "workspace_members", memberId), {
        status: 'removed',
    });
}

/**
 * Update member role
 */
export async function updateMemberRole(
    workspaceId: string,
    userId: string,
    newRole: WorkspaceRole
): Promise<void> {
    const memberId = `${workspaceId}_${userId}`;
    await updateDoc(doc(db, "workspace_members", memberId), {
        role: newRole,
    });
}

/**
 * Get user's role in workspace
 */
export async function getMemberRole(
    workspaceId: string,
    userId: string
): Promise<WorkspaceRole | null> {
    const memberId = `${workspaceId}_${userId}`;
    const memberDoc = await getDoc(doc(db, "workspace_members", memberId));

    if (!memberDoc.exists()) return null;

    const member = memberDoc.data() as WorkspaceMember;
    if (member.status !== 'active') return null;

    return member.role;
}

/**
 * Check if user is a member of workspace
 */
export async function isWorkspaceMember(
    workspaceId: string,
    userId: string
): Promise<boolean> {
    const role = await getMemberRole(workspaceId, userId);
    return role !== null;
}

/**
 * Get workspace member details
 */
export async function getWorkspaceMember(
    workspaceId: string,
    userId: string
): Promise<WorkspaceMember | null> {
    const memberId = `${workspaceId}_${userId}`;
    const memberDoc = await getDoc(doc(db, "workspace_members", memberId));

    if (!memberDoc.exists()) return null;
    return memberDoc.data() as WorkspaceMember;
}

/**
 * Get all members of a workspace
 */
export async function getWorkspaceMembers(
    workspaceId: string,
    includeUserDetails: boolean = false
): Promise<WorkspaceMember[] | WorkspaceMemberWithUser[]> {
    const membersQuery = query(
        collection(db, "workspace_members"),
        where("workspaceId", "==", workspaceId),
        where("status", "==", "active")
    );

    const snapshot = await getDocs(membersQuery);
    const members = snapshot.docs.map(doc => doc.data() as WorkspaceMember);

    if (!includeUserDetails) {
        return members;
    }

    // Fetch user details for each member
    const membersWithUsers: WorkspaceMemberWithUser[] = [];
    for (const member of members) {
        const user = await getUser(member.userId);
        membersWithUsers.push({
            ...member,
            user: user ? {
                email: user.email,
                name: user.name,
                avatarUrl: user.avatarUrl,
            } : undefined,
        });
    }

    return membersWithUsers;
}

/**
 * Check if user is owner of workspace
 */
export async function isWorkspaceOwner(
    workspaceId: string,
    userId: string
): Promise<boolean> {
    const role = await getMemberRole(workspaceId, userId);
    return role === 'owner';
}

/**
 * Check if user is owner or admin
 */
export async function isOwnerOrAdmin(
    workspaceId: string,
    userId: string
): Promise<boolean> {
    const role = await getMemberRole(workspaceId, userId);
    return role === 'owner' || role === 'admin';
}
