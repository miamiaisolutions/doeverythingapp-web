"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Check, X, Loader2, Mail } from "lucide-react";

interface InviteDetails {
    workspaceId: string;
    workspaceName: string;
    email: string;
    role: string;
    invitedBy: string;
}

function AcceptInviteContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, firebaseUser } = useAuth();
    const [inviteToken, setInviteToken] = useState<string | null>(null);
    const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const token = searchParams.get("token");
        setInviteToken(token);
    }, [searchParams]);

    useEffect(() => {
        // Validate invite token when component loads
        if (inviteToken && user) {
            validateInvite();
        }
    }, [inviteToken, user]);

    const validateInvite = async () => {
        // In a real implementation, you would call an API to validate the invite
        // For now, we'll just simulate a successful validation
        setLoading(false);
        setInviteDetails({
            workspaceId: "workspace_123",
            workspaceName: "Miami AI Solutions",
            email: user?.email || "",
            role: "member",
            invitedBy: "John Doe",
        });
    };

    const handleAccept = async () => {
        if (!inviteToken || !firebaseUser) return;

        setAccepting(true);
        setError(null);

        try {
            const idToken = await firebaseUser.getIdToken();
            const response = await fetch("/api/team/accept-invite", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ inviteToken }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to accept invitation");
            }

            setSuccess(true);

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                router.push("/dashboard");
            }, 2000);
        } catch (err: any) {
            setError(err.message || "Failed to accept invitation");
        } finally {
            setAccepting(false);
        }
    };

    const handleDecline = () => {
        router.push("/dashboard");
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Please sign in to accept this invitation
                    </h2>
                    <button
                        onClick={() => router.push("/login")}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="max-w-md w-full mx-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Welcome to the team!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            You've successfully joined the workspace.
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                            Redirecting to dashboard...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!inviteDetails) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="max-w-md w-full mx-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <X className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Invalid Invitation
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            This invitation link is invalid or has expired.
                        </p>
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
            <div className="max-w-md w-full">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                        Workspace Invitation
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
                        You've been invited to join a workspace
                    </p>

                    {/* Invite Details */}
                    <div className="space-y-4 mb-8">
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Workspace</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {inviteDetails.workspaceName}
                            </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Role</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                                {inviteDetails.role}
                            </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {inviteDetails.email}
                            </p>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleDecline}
                            disabled={accepting}
                            className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Decline
                        </button>
                        <button
                            onClick={handleAccept}
                            disabled={accepting}
                            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {accepting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Accepting...
                                </>
                            ) : (
                                "Accept Invitation"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AcceptInvitePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        }>
            <AcceptInviteContent />
        </Suspense>
    );
}
