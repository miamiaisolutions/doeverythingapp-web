"use client";

import { CreditCard, Zap, Check, Loader2, AlertCircle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { SUBSCRIPTION_PLANS } from "@/config/subscriptions";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function BillingSettings() {
    const { plan, status, isLoading, isCanceledAtPeriodEnd } = useSubscription();
    const { user, firebaseUser } = useAuth();
    const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();

    const isSuccess = searchParams.get("success");
    const isCanceled = searchParams.get("canceled");

    async function handleUpgrade(planId: string) {
        setIsCheckoutLoading(true);
        try {
            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await firebaseUser?.getIdToken()}`,
                },
                body: JSON.stringify({
                    planId,
                    userId: user?.uid,
                }),
            });

            if (!response.ok) throw new Error("Failed to create checkout session");

            const { url } = await response.json();
            window.location.href = url;
        } catch (error) {
            console.error(error);
            alert("Something went wrong. Please try again.");
            setIsCheckoutLoading(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {isSuccess && (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-lg flex items-center gap-2 border border-green-200 dark:border-green-800">
                    <Check className="w-5 h-5" />
                    Subscription updated successfully!
                </div>
            )}
            {isCanceled && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 p-4 rounded-lg flex items-center gap-2 border border-yellow-200 dark:border-yellow-800">
                    <AlertCircle className="w-5 h-5" />
                    Subscription checkout canceled.
                </div>
            )}

            {/* Current Plan */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your billing and plan details.</p>
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Plan</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{plan.name} Plan</h3>
                            {isCanceledAtPeriodEnd && (
                                <p className="text-xs text-amber-500 mt-1">Cancels at end of period</p>
                            )}
                        </div>
                        {/* Only show upgrade button if not on highest tier or if managing active sub */}
                        {plan.id !== 'premium' && (
                            <button
                                onClick={() => handleUpgrade("pro")}
                                disabled={isCheckoutLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCheckoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upgrade"}
                            </button>
                        )}
                        {plan.id !== 'free' && (
                            <button
                                onClick={() => {/* Manage logic logic out of scope for now, usually portal link */ }}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium text-sm ml-2"
                            >
                                Manage Billing
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700 dark:text-gray-300">Webhooks</span>
                                <span className="text-gray-900 dark:text-white font-medium">{plan.limits.webhooks === 200 ? '200+' : plan.limits.webhooks} / {plan.limits.webhooks}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: "10%" }}></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700 dark:text-gray-300">Conversations</span>
                                <span className="text-gray-900 dark:text-white font-medium">5 / {plan.limits.conversations === 1000 ? 'Unlimited' : plan.limits.conversations}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: "20%" }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Plan Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(SUBSCRIPTION_PLANS).map((p) => {
                    const isCurrent = plan.id === p.id;
                    return (
                        <div
                            key={p.id}
                            className={`p-4 rounded-xl border-2 ${isCurrent ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"} relative transition-all`}
                        >
                            {isCurrent && (
                                <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg font-bold">CURRENT</div>
                            )}
                            <h4 className="font-bold text-gray-900 dark:text-white">{p.name}</h4>
                            <p className="text-2xl font-bold mt-2">${p.price}<span className="text-sm font-normal text-gray-500">/mo</span></p>
                            <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                {p.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> {feature}</li>
                                ))}
                            </ul>
                            {!isCurrent && p.id !== 'free' && (
                                <button
                                    onClick={() => handleUpgrade(p.id)}
                                    disabled={isCheckoutLoading}
                                    className="mt-6 w-full py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                                >
                                    {isCheckoutLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Upgrade to ${p.name}`}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
