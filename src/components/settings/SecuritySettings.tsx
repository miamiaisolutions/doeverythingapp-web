"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { Shield, Key, Loader2, Check, ShieldAlert, Lock } from "lucide-react";

export default function SecuritySettings() {
    const { user, firebaseUser } = useAuth();
    const [providerId, setProviderId] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const checkProvider = async () => {
            if (firebaseUser) {
                try {
                    const tokenResult = await firebaseUser.getIdTokenResult();
                    const provider = tokenResult.signInProvider;
                    console.log("Sign-in Provider:", provider);

                    // Map firebase provider strings to our internal logic
                    // 'password' -> email/password
                    // 'google.com' -> Google
                    setProviderId(provider);
                } catch (e) {
                    console.error("Failed to get token result", e);
                    // Fallback to providerData if token fails
                    const provider = firebaseUser.providerData[0]?.providerId;
                    setProviderId(provider || 'unknown');
                }
            }
        };
        checkProvider();
    }, [firebaseUser]);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firebaseUser) return;

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: "New passwords do not match." });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: "Password must be at least 6 characters." });
            return;
        }

        setIsSaving(true);
        setMessage(null);

        try {
            // First, we try to update directly.
            await updatePassword(firebaseUser, newPassword);
            setMessage({ type: 'success', text: "Password updated successfully!" });
            setNewPassword("");
            setConfirmPassword("");
            setCurrentPassword("");
        } catch (error: any) {
            console.error("Error updating password:", error);
            if (error.code === 'auth/requires-recent-login') {
                if (currentPassword) {
                    try {
                        const credential = EmailAuthProvider.credential(firebaseUser.email!, currentPassword);
                        await reauthenticateWithCredential(firebaseUser, credential);
                        // Retry update
                        await updatePassword(firebaseUser, newPassword);
                        setMessage({ type: 'success', text: "Password updated successfully!" });
                        setNewPassword("");
                        setConfirmPassword("");
                        setCurrentPassword("");
                        return;
                    } catch (reAuthError) {
                        console.error("Re-auth failed", reAuthError);
                        setMessage({ type: 'error', text: "Current password is incorrect." });
                    }
                } else {
                    setMessage({ type: 'error', text: "For security, please enter your current password." });
                }
            } else {
                setMessage({ type: 'error', text: "Failed to update password. Please try again." });
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) return null;

    const isSSO = providerId && providerId !== 'password';

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your password and sign-in methods.</p>
                    </div>
                </div>

                <div className="p-6">
                    {providerId === 'password' ? (
                        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">

                            {/* Current Password - Required for Re-auth */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Required to verify your identity.</p>
                            </div>

                            <div className="pt-2 border-t border-gray-100 dark:border-gray-800"></div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="New password"
                                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            {message && (
                                <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {message.type === 'success' ? <Check className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                    {message.text}
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSaving || !newPassword || !currentPassword}
                                    className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 disabled:opacity-50 font-medium"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                    Update Password
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                                <Lock className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                    Managed by {providerId && providerId !== 'unknown' ? providerId : "Third Party Provider"}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    You are signed in via a third-party provider. You cannot change your password here.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
