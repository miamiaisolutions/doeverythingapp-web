"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { SubscriptionTier } from "@/lib/firestore/types";
import { ShieldAlert } from "lucide-react";

export default function DevUsageSwitch() {
    const { user } = useAuth();
    const [isUpdating, setIsUpdating] = useState(false);

    // Only show in development and for authenticated users
    // Only show in development
    if (process.env.NODE_ENV !== "development") {
        return null;
    }

    const tiers: SubscriptionTier[] = ["free", "pro", "premium"];

    const handleTierChange = async (newTier: SubscriptionTier) => {
        if (!user?.currentWorkspaceId || !confirm(`Switch workspace to ${newTier}?`)) return;

        setIsUpdating(true);
        try {
            const workspaceRef = doc(db, "workspaces", user.currentWorkspaceId);
            await updateDoc(workspaceRef, {
                subscriptionTier: newTier,
                updatedAt: new Date()
            });
            // Force reload to reflect changes in limits
            window.location.reload();
        } catch (error) {
            console.error("Failed to update tier", error);
            alert("Failed to update tier");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="fixed top-20 right-4 z-[100] bg-yellow-100 border-2 border-yellow-400 p-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-2 mb-2 text-yellow-900 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                Dev Mode: Tier Switch
            </div>
            <div className="flex gap-1">
                {tiers.map((t) => (
                    <button
                        key={t}
                        onClick={() => handleTierChange(t)}
                        disabled={isUpdating}
                        className="px-2 py-1 text-xs font-semibold text-gray-900 bg-white border border-yellow-300 rounded hover:bg-yellow-50 capitalize shadow-sm"
                    >
                        {t}
                    </button>
                ))}
            </div>
        </div>
    );
}
