
import { NextRequest, NextResponse } from "next/server";
import { auth } from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebase-admin";
import { stripe } from "@/lib/stripe";
import { SUBSCRIPTION_PLANS } from "@/config/subscriptions";
import { absoluteUrl } from "@/lib/utils";

// Ensure Firebase Admin is initialized
initAdmin();

export async function POST(req: NextRequest) {
    try {
        const { planId, userId } = await req.json();

        if (!userId || !planId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // verify auth token
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await auth().verifyIdToken(token);

        if (decodedToken.uid !== userId) {
            return new NextResponse("Unauthorized Access", { status: 403 });
        }

        const plan = SUBSCRIPTION_PLANS[planId.toUpperCase()];
        if (!plan) {
            return new NextResponse("Invalid plan", { status: 400 });
        }

        if (!plan.stripePriceId) {
            return new NextResponse("Plan does not have a price ID", { status: 400 });
        }

        const db = getFirestore();
        const userDoc = await db.collection("users").doc(userId).get();
        const userData = userDoc.data();

        if (!userData) {
            return new NextResponse("User not found", { status: 404 });
        }

        let stripeCustomerId = userData.stripeCustomerId;

        // Create Stripe Customer if not exists
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: userData.email,
                name: userData.name,
                metadata: {
                    userId: userId,
                },
            });
            stripeCustomerId = customer.id;
            await userDoc.ref.update({ stripeCustomerId });
        }

        const billingUrl = absoluteUrl("/settings");

        // Check if user already has a subscription
        // If so, we might want to create a portal session instead, or update the subscription.
        // For V1, we will assume "Upgrade" always triggers a new checkout for simplicity,
        // but a robust implementation would check for existing active subscriptions to prevent duplicates.
        // Ideally, if they have an active subscription, send them to billing portal or update subscription API.

        // For now, simpler flow: Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            line_items: [
                {
                    price: plan.stripePriceId,
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: `${billingUrl}?success=true`,
            cancel_url: `${billingUrl}?canceled=true`,
            metadata: {
                userId: userId,
                planId: planId,
            },
            subscription_data: {
                metadata: {
                    userId: userId,
                    planId: planId
                }
            }
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        console.error("[STRIPE_CHECKOUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
