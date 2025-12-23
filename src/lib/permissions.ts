import { WorkspaceRole } from "./firestore/workspaceTypes";
import { getMemberRole } from "./firestore/workspaceMembers";

/**
 * Permission definitions
 * Maps each permission to the roles that have access to it
 */
export const PERMISSIONS = {
    // Workspace management
    MANAGE_WORKSPACE: ['owner', 'admin'],
    DELETE_WORKSPACE: ['owner'],

    // Team management
    INVITE_MEMBERS: ['owner', 'admin'],
    REMOVE_MEMBERS: ['owner', 'admin'],
    CHANGE_MEMBER_ROLES: ['owner'], // Only owner can change roles
    CHANGE_ADMIN_TO_MEMBER: ['owner'], // Only owner can demote admins
    REMOVE_ADMIN: ['owner'], // Only owner can remove admins

    // Billing
    MANAGE_BILLING: ['owner', 'admin'],
    VIEW_BILLING: ['owner', 'admin'],

    // Webhooks
    CREATE_WEBHOOK: ['owner', 'admin', 'member'],
    EDIT_ANY_WEBHOOK: ['owner', 'admin'],
    EDIT_OWN_WEBHOOK: ['owner', 'admin', 'member'],
    DELETE_ANY_WEBHOOK: ['owner', 'admin'],
    DELETE_OWN_WEBHOOK: ['owner', 'admin', 'member'],
    VIEW_WEBHOOKS: ['owner', 'admin', 'member'],

    // Conversations
    VIEW_ALL_CONVERSATIONS: ['owner', 'admin'],
    VIEW_OWN_CONVERSATIONS: ['owner', 'admin', 'member'],
    CREATE_CONVERSATION: ['owner', 'admin', 'member'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a user has a specific permission in a workspace
 * 
 * @param userId - User ID to check
 * @param workspaceId - Workspace ID
 * @param permission - Permission to check
 * @param resourceOwnerId - Optional: For resource-specific permissions (e.g., webhook creator)
 */
export async function hasPermission(
    userId: string,
    workspaceId: string,
    permission: Permission,
    resourceOwnerId?: string
): Promise<boolean> {
    const role = await getMemberRole(workspaceId, userId);
    if (!role) return false;

    // Special case: For "OWN" permissions, check if user owns the resource
    if (permission.includes('_OWN_') && resourceOwnerId) {
        if (userId !== resourceOwnerId) {
            // User doesn't own the resource, check if they have "ANY" permission
            const anyPermission = permission.replace('_OWN_', '_ANY_') as Permission;
            if (anyPermission in PERMISSIONS) {
                return (PERMISSIONS[anyPermission] as readonly WorkspaceRole[]).includes(role);
            }
            return false;
        }
    }

    return (PERMISSIONS[permission] as readonly WorkspaceRole[]).includes(role);
}

/**
 * Check if user can manage team (invite, remove members)
 */
export async function canManageTeam(
    userId: string,
    workspaceId: string
): Promise<boolean> {
    return hasPermission(userId, workspaceId, 'INVITE_MEMBERS');
}

/**
 * Check if user can manage billing
 */
export async function canManageBilling(
    userId: string,
    workspaceId: string
): Promise<boolean> {
    return hasPermission(userId, workspaceId, 'MANAGE_BILLING');
}

/**
 * Check if user can edit a specific webhook
 */
export async function canEditWebhook(
    userId: string,
    workspaceId: string,
    webhookCreatorId: string
): Promise<boolean> {
    // First check if user can edit own webhook
    if (userId === webhookCreatorId) {
        return hasPermission(userId, workspaceId, 'EDIT_OWN_WEBHOOK', webhookCreatorId);
    }

    // Otherwise check if they can edit any webhook
    return hasPermission(userId, workspaceId, 'EDIT_ANY_WEBHOOK');
}

/**
 * Check if user can delete a specific webhook
 */
export async function canDeleteWebhook(
    userId: string,
    workspaceId: string,
    webhookCreatorId: string
): Promise<boolean> {
    // First check if user can delete own webhook
    if (userId === webhookCreatorId) {
        return hasPermission(userId, workspaceId, 'DELETE_OWN_WEBHOOK', webhookCreatorId);
    }

    // Otherwise check if they can delete any webhook
    return hasPermission(userId, workspaceId, 'DELETE_ANY_WEBHOOK');
}

/**
 * Check if user can remove a specific member
 */
export async function canRemoveMember(
    userId: string,
    workspaceId: string,
    targetUserId: string
): Promise<boolean> {
    const userRole = await getMemberRole(workspaceId, userId);
    const targetRole = await getMemberRole(workspaceId, targetUserId);

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
 * Check if user can change a member's role
 */
export async function canChangeMemberRole(
    userId: string,
    workspaceId: string,
    targetUserId: string,
    newRole: WorkspaceRole
): Promise<boolean> {
    const userRole = await getMemberRole(workspaceId, userId);
    const targetRole = await getMemberRole(workspaceId, targetUserId);

    if (!userRole || !targetRole) return false;

    // Only owner can change roles
    if (userRole !== 'owner') return false;

    // Cannot change owner role
    if (targetRole === 'owner' || newRole === 'owner') return false;

    return true;
}

/**
 * Get user role (convenience function)
 */
export async function getUserRole(
    userId: string,
    workspaceId: string
): Promise<WorkspaceRole | null> {
    return getMemberRole(workspaceId, userId);
}

/**
 * Check if user is owner
 */
export async function isOwner(
    userId: string,
    workspaceId: string
): Promise<boolean> {
    const role = await getMemberRole(workspaceId, userId);
    return role === 'owner';
}

/**
 * Check if user is admin
 */
export async function isAdmin(
    userId: string,
    workspaceId: string
): Promise<boolean> {
    const role = await getMemberRole(workspaceId, userId);
    return role === 'admin';
}

/**
 * Check if user is owner or admin
 */
export async function isOwnerOrAdmin(
    userId: string,
    workspaceId: string
): Promise<boolean> {
    const role = await getMemberRole(workspaceId, userId);
    return role === 'owner' || role === 'admin';
}
