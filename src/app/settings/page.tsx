"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProtectedLayout from "@/components/layouts/ProtectedLayout";
import GeneralSettings from "@/components/settings/GeneralSettings";
import DeveloperSettings from "@/components/settings/DeveloperSettings";
import BillingSettings from "@/components/settings/BillingSettings";
import TeamSettings from "@/components/settings/TeamSettings";
import ProfileSettings from "@/components/settings/ProfileSettings";
import SecuritySettings from "@/components/settings/SecuritySettings";
import { Settings, Code2, CreditCard, Users, User } from "lucide-react";

type Tab = "general" | "developer" | "billing" | "team" | "account";

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <ProtectedLayout>
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="text-gray-500">Loading settings...</div>
                </div>
            </ProtectedLayout>
        }>
            <SettingsContent />
        </Suspense>
    );
}

function SettingsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialTab = (searchParams.get("tab") as Tab) || "general";
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);

    // Update URL when tab changes without full reload
    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tab);
        window.history.pushState({}, "", url.toString());
    };

    const tabs = [
        { id: "general", label: "General", icon: Settings },
        { id: "account", label: "Account", icon: User },
        { id: "developer", label: "Developer", icon: Code2 },
        { id: "billing", label: "Billing", icon: CreditCard },
        { id: "team", label: "Team", icon: Users },
    ] as const;

    return (
        <ProtectedLayout>
            <div className="max-w-5xl mx-auto p-6 space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your workspace preferences and configuration.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <nav className="w-full md:w-64 flex-shrink-0 space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0">
                        {activeTab === "general" && <GeneralSettings />}
                        {activeTab === "account" && (
                            <div className="space-y-8">
                                <ProfileSettings />
                                <SecuritySettings />
                            </div>
                        )}
                        {activeTab === "developer" && <DeveloperSettings />}
                        {activeTab === "billing" && <BillingSettings />}
                        {activeTab === "team" && <TeamSettings />}
                    </div>
                </div>
            </div>
        </ProtectedLayout>
    );
}
