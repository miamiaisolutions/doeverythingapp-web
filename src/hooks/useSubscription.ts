
import { useState, useEffect } from "react";
import { User } from "@/lib/firestore/types";
import { useAuth } from "@/hooks/useAuth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from "@/config/subscriptions";

export interface SubscriptionState {
    planId: string;
    status: "active" | "canceled" | "past_due" | "incomplete" | "none";
    plan: SubscriptionPlan;
    isLoading: boolean;
    isCanceledAtPeriodEnd: boolean;
}

export function useSubscription() {
    const { user, loading: authLoading } = useAuth();
    const [subscription, setSubscription] = useState<SubscriptionState>({
        planId: "free",
        status: "none",
        plan: SUBSCRIPTION_PLANS.FREE,
        isLoading: true,
        isCanceledAtPeriodEnd: false
    });

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setSubscription(prev => ({ ...prev, isLoading: false }));
            return;
        }

        const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
            if (doc.exists()) {
                const userData = doc.data() as User;
                const userSub = userData.subscription;

                if (userSub) {
                    const planId = userSub.planId || "free";
                    const plan = SUBSCRIPTION_PLANS[planId.toUpperCase()] || SUBSCRIPTION_PLANS.FREE;

                    setSubscription({
                        planId: planId,
                        status: userSub.status || "active", // Default active if sub exists
                        plan: plan,
                        isLoading: false,
                        isCanceledAtPeriodEnd: userSub.cancelAtPeriodEnd || false
                    });
                } else {
                    // Default to free
                    setSubscription({
                        planId: "free",
                        status: "active",
                        plan: SUBSCRIPTION_PLANS.FREE,
                        isLoading: false,
                        isCanceledAtPeriodEnd: false
                    });
                }
            } else {
                setSubscription(prev => ({ ...prev, isLoading: false }));
            }
        }, (error) => {
            console.error("Error fetching subscription:", error);
            setSubscription(prev => ({ ...prev, isLoading: false }));
        });

        return () => unsub();
    }, [user, authLoading]);

    return subscription;
}
