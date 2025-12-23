import { Timestamp } from "firebase/firestore";
import { SubscriptionTier } from "./types";

/**
 * User role within a workspace
 * - owner: Workspace creator, full admin access, cannot be removed
 * - admin: Full admin access, can be removed by owner
 * - member: Standard team member, limited permissions
 */
export type WorkspaceRole = 'owner' | 'admin' | 'member';

/**
 * Workspace represents a team/organization that owns webhooks and conversations
 */
export interface Workspace {
    id: string;
    name: string;
    ownerId: string; // User ID of the workspace owner
    subscriptionTier: SubscriptionTier;
    stripeCustomerId?: string; // Workspace-level Stripe customer
    subscriptionStatus?: "active" | "canceled" | "past_due" | "trialing" | "incomplete";
    planId?: string;
    maxMembers: number; // Based on tier: Free=1, Pro=3, Premium=10
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

/**
 * WorkspaceMember represents a user's membership in a workspace
 */
export interface WorkspaceMember {
    id: string; // Composite: {workspaceId}_{userId}
    workspaceId: string;
    userId: string;
    role: WorkspaceRole;
    invitedBy: string; // User ID who invited this member
    invitedAt: Timestamp;
    joinedAt?: Timestamp; // Set when invite is accepted
    status: 'active' | 'invited' | 'removed';
}

/**
 * WorkspaceInvite represents a pending invitation to join a workspace
 */
export interface WorkspaceInvite {
    id: string;
    workspaceId: string;
    email: string;
    role: 'admin' | 'member'; // Cannot invite as owner
    invitedBy: string; // User ID who sent the invite
    token: string; // Unique invite token for acceptance link
    expiresAt: Timestamp; // Default: 7 days from creation
    createdAt: Timestamp;
    status: 'pending' | 'accepted' | 'expired' | 'cancelled';
}

/**
 * DeveloperAccess represents a developer's access to a client workspace
 * This is for the Developer role (v2 feature)
 */
export interface DeveloperAccess {
    id: string; // Composite: {developerId}_{workspaceId}
    developerId: string; // User ID with developer subscription
    workspaceId: string; // Workspace they have access to
    grantedBy: string; // Workspace owner who granted access
    accessLevel: 'read' | 'write'; // Configurable by workspace owner
    grantedAt: Timestamp;
}

/**
 * Helper type for workspace member with user details populated
 */
export interface WorkspaceMemberWithUser extends WorkspaceMember {
    user?: {
        email: string;
        name?: string;
        avatarUrl?: string;
    };
}

/**
 * Tier limits configuration
 */
export const TIER_LIMITS = {
    free: {
        maxMembers: 1,
        maxWebhooks: 2,
        timeoutSeconds: 5,
    },
    pro: {
        maxMembers: 3,
        maxWebhooks: 50,
        timeoutSeconds: 15,
    },
    premium: {
        maxMembers: 10,
        maxWebhooks: 200,
        timeoutSeconds: 60,
    },
} as const;
