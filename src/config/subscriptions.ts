
export interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    stripePriceId: string;
    price: number;
    features: string[];
    limits: {
        webhooks: number;
        conversations: number;
        teamMembers: number;
        timeoutSeconds: number;
    };
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
    FREE: {
        id: 'free',
        name: 'Free',
        description: 'Perfect for testing and personal use.',
        stripePriceId: '', // Free plan has no price ID
        price: 0,
        features: ['2 Webhooks', '5 Conversations', 'Community Support'],
        limits: {
            webhooks: 2,
            conversations: 5,
            teamMembers: 1,
            timeoutSeconds: 5,
        },
    },
    PRO: {
        id: 'pro',
        name: 'Pro',
        description: 'For power users and small projects.',
        stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? '',
        price: 14,
        features: ['50 Webhooks', 'Unlimited Chats', '3 Team Members'],
        limits: {
            webhooks: 50,
            conversations: 1000, // Effectively unlimited
            teamMembers: 3,
            timeoutSeconds: 15,
        },
    },
    PREMIUM: {
        id: 'premium',
        name: 'Premium',
        description: 'For teams and critical automation.',
        stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID ?? '',
        price: 24,
        features: ['200 Webhooks', 'Priority Support', '10 Team Members'],
        limits: {
            webhooks: 200,
            conversations: 1000, // Effectively unlimited
            teamMembers: 10,
            timeoutSeconds: 60,
        },
    },
};
