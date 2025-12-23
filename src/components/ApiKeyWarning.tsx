"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function ApiKeyWarning() {
    const { user, firebaseUser } = useAuth();
    const [hasKey, setHasKey] = useState<boolean | null>(null);

    useEffect(() => {
        if (user) {
            checkApiKey();
        }
    }, [user]);

    const checkApiKey = async () => {
        try {
            const token = await firebaseUser?.getIdToken();
            const res = await fetch("/api/user/api-key", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setHasKey(data.hasApiKey);
            } else {
                // If the check fails, assume no key is set or there's an issue
                const errorData = await res.json().catch(() => ({}));
                console.error("API key check failed with status:", res.status, errorData);
                setHasKey(false);
            }
        } catch (error) {
            console.error("Failed to check API key status", error);
            // On network error, safe to show warning
            setHasKey(false);
        }
    };

    if (hasKey === null || hasKey === true) {
        return null;
    }

    return (
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>
                OpenAI API Key missing. Chat functionality will not work.
            </span>
            <Link href="/settings?tab=developer" className="underline hover:text-amber-100">
                Configure Now
            </Link>
        </div>
    );
}
