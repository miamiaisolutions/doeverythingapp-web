import { SubscriptionTier } from "../types";

export interface TierLimits {
    maxWebhooks: number;
    timeoutSeconds: number;
    maxConversations: number;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
    free: {
        maxWebhooks: 2,
        timeoutSeconds: 5,
        maxConversations: 5,
    },
    pro: {
        maxWebhooks: 50,
        timeoutSeconds: 15,
        maxConversations: 5,
    },
    premium: {
        maxWebhooks: 200,
        timeoutSeconds: 60,
        maxConversations: 5,
    },
};

/**
 * Get tier limits for a given subscription tier
 */
export function getTierLimits(tier: SubscriptionTier = "free"): TierLimits {
    return TIER_LIMITS[tier];
}

/**
 * Validate that requested timeout doesn't exceed tier maximum
 */
export function validateTimeout(tier: SubscriptionTier, requestedTimeout?: number): number {
    const limits = getTierLimits(tier);
    if (!requestedTimeout) {
        return limits.timeoutSeconds;
    }
    return Math.min(requestedTimeout, limits.timeoutSeconds);
}

/**
 * Check if user can execute webhook (placeholder for rate limiting)
 */
export async function canExecuteWebhook(userId: string, tier: SubscriptionTier): Promise<boolean> {
    // TODO: Implement rate limiting logic
    // For now, always allow
    return true;
}
