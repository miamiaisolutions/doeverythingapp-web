"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Check, Key, Loader2, Save, ShieldAlert, Bot } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export default function DeveloperSettings() {
    const { user, firebaseUser } = useAuth();
    const [apiKey, setApiKey] = useState("");
    const [hasKey, setHasKey] = useState(false);
    const [maskedKey, setMaskedKey] = useState<string | null>(null);
    const [systemPersona, setSystemPersona] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingKey, setIsSavingKey] = useState(false);
    const [isSavingPersona, setIsSavingPersona] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [keyMessage, setKeyMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [personaMessage, setPersonaMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (user) {
            fetchSettings();
        }
    }, [user]);

    const fetchSettings = async () => {
        try {
            // Check API Key status via API (since it's encrypted/server-side)
            const token = await firebaseUser?.getIdToken();
            const keyRes = await fetch("/api/user/api-key", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (keyRes.ok) {
                const data = await keyRes.json();
                setHasKey(data.hasApiKey);
                setMaskedKey(data.maskedKey);
            }

            // Fetch System Persona from Firestore (client-side allowed for this field)
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    setSystemPersona(userDoc.data().systemPersona || "");
                }
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveKey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!apiKey.trim()) return;

        setIsSavingKey(true);
        setKeyMessage(null);

        try {
            const token = await firebaseUser?.getIdToken();
            const res = await fetch("/api/user/api-key", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ apiKey: apiKey.trim() }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to save API key");

            setHasKey(true);
            setMaskedKey(data.maskedKey);
            setApiKey("");
            setKeyMessage({ type: 'success', text: "API Key verified and saved!" });
        } catch (error: any) {
            setKeyMessage({ type: 'error', text: error.message || "Failed to save API Key." });
        } finally {
            setIsSavingKey(false);
        }
    };

    const handleDisconnectKey = async () => {
        if (!confirm("Are you sure you want to remove your API key? You won't be able to use the AI features.")) return;

        setIsDisconnecting(true);
        try {
            const token = await firebaseUser?.getIdToken();
            const res = await fetch("/api/user/api-key", {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error("Failed to delete key");

            setHasKey(false);
            setMaskedKey(null);
            setKeyMessage(null);
        } catch (error) {
            console.error(error);
            alert("Failed to disconnect key.");
        } finally {
            setIsDisconnecting(false);
        }
    };

    const handleSavePersona = async () => {
        if (!user) return;
        setIsSavingPersona(true);
        setPersonaMessage(null);

        try {
            await updateDoc(doc(db, "users", user.uid), {
                systemPersona: systemPersona.trim()
            });
            setPersonaMessage({ type: 'success', text: "System Persona saved!" });
        } catch (error) {
            console.error("Error saving persona", error);
            setPersonaMessage({ type: 'error', text: "Failed to save persona." });
        } finally {
            setIsSavingPersona(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading settings...</div>;
    }

    return (
        <div className="space-y-6">
            {/* OpenAI Configuration */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Key className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">OpenAI Configuration</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Connect your OpenAI account.</p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${hasKey ? 'bg-green-500' : 'bg-amber-500'}`} />
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {hasKey ? `Verified • ${maskedKey || 'Hidden'}` : "Not Configured"}
                            </span>
                        </div>
                        {hasKey && (
                            <button
                                onClick={handleDisconnectKey}
                                disabled={isDisconnecting}
                                className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                            >
                                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSaveKey} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {hasKey ? "Update API Key" : "API Key"}
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder={hasKey ? "Enter new key to replace..." : "sk-..."}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <Key className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                            </div>
                        </div>

                        {keyMessage && (
                            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${keyMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {keyMessage.type === 'success' ? <Check className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                {keyMessage.text}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSavingKey || !apiKey.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 disabled:opacity-50"
                            >
                                {isSavingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {hasKey ? "Update Key" : "Save Key"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* System Persona */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">System Persona</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Customize how the AI behaves and responds to you.</p>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Custom Instructions</label>
                        <textarea
                            value={systemPersona}
                            onChange={(e) => setSystemPersona(e.target.value)}
                            placeholder="e.g. You are a senior DevOps engineer. Be concise and technical."
                            className="w-full h-32 p-3 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            These instructions will be added to the system prompt for every chat.
                        </p>
                    </div>

                    {personaMessage && (
                        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${personaMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {personaMessage.type === 'success' ? <Check className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                            {personaMessage.text}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={handleSavePersona}
                            disabled={isSavingPersona}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                            {isSavingPersona ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Persona
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
