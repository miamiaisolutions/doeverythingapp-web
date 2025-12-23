"use client";

import { CreditCard, Zap, Check } from "lucide-react";

export default function BillingSettings() {
    return (
        <div className="space-y-6">
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
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Free Plan</h3>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
                            Upgrade to Pro
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700 dark:text-gray-300">Webhooks</span>
                                <span className="text-gray-900 dark:text-white font-medium">2 / 2</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: "100%" }}></div>
                            </div>
                            <p className="text-xs text-red-500 mt-1">Limit reached. Upgrade for more.</p>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700 dark:text-gray-300">Conversations</span>
                                <span className="text-gray-900 dark:text-white font-medium">3 / 5</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: "60%" }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Plan Comparison (Mock) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 relative">
                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-bl-lg rounded-tr-lg font-bold">CURRENT</div>
                    <h4 className="font-bold text-gray-900 dark:text-white">Free</h4>
                    <p className="text-2xl font-bold mt-2">$0<span className="text-sm font-normal text-gray-500">/mo</span></p>
                    <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 2 Webhooks</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 5 Conversations</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Community Support</li>
                    </ul>
                </div>
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 opacity-60 hover:opacity-100 transition-opacity">
                    <h4 className="font-bold text-gray-900 dark:text-white">Pro</h4>
                    <p className="text-2xl font-bold mt-2">$14<span className="text-sm font-normal text-gray-500">/mo</span></p>
                    <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 50 Webhooks</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Unlimited Chats</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 3 Team Members</li>
                    </ul>
                </div>
                <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 opacity-60 hover:opacity-100 transition-opacity">
                    <h4 className="font-bold text-gray-900 dark:text-white">Premium</h4>
                    <p className="text-2xl font-bold mt-2">$24<span className="text-sm font-normal text-gray-500">/mo</span></p>
                    <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 200 Webhooks</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Priority Support</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 10 Team Members</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
