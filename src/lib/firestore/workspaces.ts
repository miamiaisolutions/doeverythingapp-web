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
import { Workspace, TIER_LIMITS } from "./workspaceTypes";
import { SubscriptionTier } from "./types";

/**
 * Create a new workspace
 */
export async function createWorkspace(
    ownerId: string,
    name: string,
    tier: SubscriptionTier = 'free'
): Promise<Workspace> {
    const workspaceRef = doc(collection(db, "workspaces"));
    const workspace: Workspace = {
        id: workspaceRef.id,
        name,
        ownerId,
        subscriptionTier: tier,
        maxMembers: TIER_LIMITS[tier].maxMembers,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    await setDoc(workspaceRef, workspace);
    return workspace;
}

/**
 * Get workspace by ID
 */
export async function getWorkspace(workspaceId: string): Promise<Workspace | null> {
    const workspaceDoc = await getDoc(doc(db, "workspaces", workspaceId));
    if (!workspaceDoc.exists()) return null;
    return workspaceDoc.data() as Workspace;
}

/**
 * Update workspace
 */
export async function updateWorkspace(
    workspaceId: string,
    data: Partial<Workspace>
): Promise<void> {
    await updateDoc(doc(db, "workspaces", workspaceId), {
        ...data,
        updatedAt: Timestamp.now(),
    });
}

/**
 * Get all workspaces where user is a member
 */
export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
    // Query workspace_members where userId matches and status is active
    const membersQuery = query(
        collection(db, "workspace_members"),
        where("userId", "==", userId),
        where("status", "==", "active")
    );

    const membersSnapshot = await getDocs(membersQuery);
    const workspaceIds = membersSnapshot.docs.map(doc => doc.data().workspaceId);

    if (workspaceIds.length === 0) return [];

    // Fetch all workspaces
    const workspaces: Workspace[] = [];
    for (const workspaceId of workspaceIds) {
        const workspace = await getWorkspace(workspaceId);
        if (workspace) {
            workspaces.push(workspace);
        }
    }

    return workspaces;
}

/**
 * Get workspace member count
 */
export async function getMemberCount(workspaceId: string): Promise<number> {
    const membersQuery = query(
        collection(db, "workspace_members"),
        where("workspaceId", "==", workspaceId),
        where("status", "==", "active")
    );

    const snapshot = await getDocs(membersQuery);
    return snapshot.size;
}

/**
 * Check if workspace has reached member limit
 */
export async function isAtMemberLimit(workspaceId: string): Promise<boolean> {
    const workspace = await getWorkspace(workspaceId);
    if (!workspace) return true;

    const currentCount = await getMemberCount(workspaceId);
    return currentCount >= workspace.maxMembers;
}

/**
 * Update workspace tier and adjust limits
 */
export async function updateWorkspaceTier(
    workspaceId: string,
    newTier: SubscriptionTier
): Promise<void> {
    await updateWorkspace(workspaceId, {
        subscriptionTier: newTier,
        maxMembers: TIER_LIMITS[newTier].maxMembers,
    });
}
