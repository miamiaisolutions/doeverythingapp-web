"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import ApiKeyWarning from "@/components/ApiKeyWarning";
import NetworkBackground from "@/components/landing/NetworkBackground";
import Spotlight from "@/components/landing/Spotlight";

export default function ProtectedLayout({
    children,
    disableScroll = false,
}: {
    children: React.ReactNode;
    disableScroll?: boolean;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white overflow-hidden relative selection:bg-orange-500 selection:text-white">

            {/* Sidebar */}
            <div className="z-20 h-full">
                <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                {/* Header (Glassy) */}
                <header className="border-b border-gray-200 dark:border-white/5 bg-white/50 dark:bg-black/50 backdrop-blur-md z-30">
                    <ApiKeyWarning />
                    <div className="h-16 flex items-center justify-end px-6">
                        <ThemeToggle />
                    </div>
                </header>

                <main className={`flex-1 relative ${disableScroll ? 'overflow-hidden flex flex-col' : 'overflow-auto'}`}>
                    {children}
                </main>
            </div>
        </div>
    );
}
