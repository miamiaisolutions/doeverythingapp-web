import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { WorkspaceInvite, WorkspaceRole } from "./workspaceTypes";
/**
 * Generate a secure invite token using Web Crypto API
 */
function generateInviteToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a workspace invitation
 */
export async function createInvite(
    workspaceId: string,
    email: string,
    role: 'admin' | 'member',
    invitedBy: string
): Promise<WorkspaceInvite> {
    const inviteRef = doc(collection(db, "workspace_invites"));
    const token = generateInviteToken();

    // Invites expire after 7 days
    const expiresAt = Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite: WorkspaceInvite = {
        id: inviteRef.id,
        workspaceId,
        email,
        role,
        invitedBy,
        token,
        expiresAt,
        createdAt: Timestamp.now(),
        status: 'pending',
    };

    await setDoc(inviteRef, invite);
    return invite;
}

/**
 * Get invite by token
 */
export async function getInviteByToken(token: string): Promise<WorkspaceInvite | null> {
    const invitesQuery = query(
        collection(db, "workspace_invites"),
        where("token", "==", token),
        where("status", "==", "pending")
    );

    const snapshot = await getDocs(invitesQuery);
    if (snapshot.empty) return null;

    const invite = snapshot.docs[0].data() as WorkspaceInvite;

    // Check if expired
    if (invite.expiresAt.toMillis() < Date.now()) {
        await updateInviteStatus(invite.id, 'expired');
        return null;
    }

    return invite;
}

/**
 * Get invite by ID
 */
export async function getInvite(inviteId: string): Promise<WorkspaceInvite | null> {
    const inviteDoc = await getDoc(doc(db, "workspace_invites", inviteId));
    if (!inviteDoc.exists()) return null;
    return inviteDoc.data() as WorkspaceInvite;
}

/**
 * Accept an invitation
 */
export async function acceptInvite(inviteId: string): Promise<void> {
    await updateDoc(doc(db, "workspace_invites", inviteId), {
        status: 'accepted',
    });
}

/**
 * Cancel an invitation
 */
export async function cancelInvite(inviteId: string): Promise<void> {
    await updateDoc(doc(db, "workspace_invites", inviteId), {
        status: 'cancelled',
    });
}

/**
 * Update invite status
 */
async function updateInviteStatus(
    inviteId: string,
    status: WorkspaceInvite['status']
): Promise<void> {
    await updateDoc(doc(db, "workspace_invites", inviteId), {
        status,
    });
}

/**
 * Get all pending invites for a workspace
 */
export async function getWorkspaceInvites(workspaceId: string): Promise<WorkspaceInvite[]> {
    const invitesQuery = query(
        collection(db, "workspace_invites"),
        where("workspaceId", "==", workspaceId),
        where("status", "==", "pending")
    );

    const snapshot = await getDocs(invitesQuery);
    return snapshot.docs.map(doc => doc.data() as WorkspaceInvite);
}

/**
 * Check if email already has pending invite for workspace
 */
export async function hasPendingInvite(
    workspaceId: string,
    email: string
): Promise<boolean> {
    const invitesQuery = query(
        collection(db, "workspace_invites"),
        where("workspaceId", "==", workspaceId),
        where("email", "==", email),
        where("status", "==", "pending")
    );

    const snapshot = await getDocs(invitesQuery);
    return !snapshot.empty;
}

/**
 * Clean up expired invites
 */
export async function cleanupExpiredInvites(): Promise<void> {
    const now = Timestamp.now();
    const invitesQuery = query(
        collection(db, "workspace_invites"),
        where("status", "==", "pending"),
        where("expiresAt", "<", now)
    );

    const snapshot = await getDocs(invitesQuery);
    const updatePromises = snapshot.docs.map(doc =>
        updateInviteStatus(doc.id, 'expired')
    );

    await Promise.all(updatePromises);
}
