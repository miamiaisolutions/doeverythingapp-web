
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { initAdmin } from "@/lib/firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from "@/config/subscriptions";

initAdmin();

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET ?? ""
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === "checkout.session.completed") {
        const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
        );

        if (!session?.metadata?.userId) {
            return new NextResponse("User id is required", { status: 400 });
        }

        await updateUserSubscription(
            session.metadata.userId,
            subscription,
            session.metadata.planId
        );
    }

    if (event.type === "customer.subscription.updated") {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId; // Ensure we attach this metadata on creation!
        // Note: Stripe subscription object itself doesn't inherently always carry custom metadata unless we put it there during checkout. 
        // In checkout session above, we added subscription_data.metadata. So it should be here.

        if (userId) {
            // We need to infer the plan ID from the price ID in the subscription items
            // This is a bit tricky if we change prices.
            const priceId = subscription.items.data[0].price.id;
            const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.stripePriceId === priceId);

            await updateUserSubscription(userId, subscription, plan?.id);
        }
    }

    if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;

        if (userId) {
            const db = getFirestore();
            await db.collection("users").doc(userId).update({
                "subscription.status": "canceled",
                "subscription.cancelAtPeriodEnd": false,
                // Downgrade to free effectively
                "subscription.planId": "free"
            });
        }
    }

    return new NextResponse(null, { status: 200 });
}

async function updateUserSubscription(userId: string, subscription: Stripe.Subscription, planId?: string) {
    const db = getFirestore();

    // Find plan by price ID if planId not explicit
    let plan: SubscriptionPlan | undefined;
    if (planId) {
        plan = SUBSCRIPTION_PLANS[planId.toUpperCase()];
    } else {
        const priceId = subscription.items.data[0].price.id;
        plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.stripePriceId === priceId);
    }

    if (!plan) return;

    await db.collection("users").doc(userId).update({
        stripeCustomerId: subscription.customer as string,
        subscription: {
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            planId: plan.id
        },
    });
}
