"use client";

import { useState, useEffect } from "react";
import { WebhookConfig } from "@/lib/firestore/types";
import { getWorkspaceWebhooks, deleteWebhook } from "@/lib/firestore/webhooks";
import { useAuth } from "@/hooks/useAuth";
import { Edit2, Trash2, Webhook, Plus, AlertCircle, History, TestTube } from "lucide-react";
import VersionHistoryModal from "./VersionHistoryModal";

interface WebhookListProps {
    onEdit: (webhook: WebhookConfig & { id: string }) => void;
    onCreate: () => void;
    onTest: (webhook: WebhookConfig & { id: string }) => void;
}

export default function WebhookList({ onEdit, onCreate, onTest }: WebhookListProps) {
    const { user } = useAuth();
    const [webhooks, setWebhooks] = useState<(WebhookConfig & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [viewingVersions, setViewingVersions] = useState<{ id: string; name: string } | null>(null);

    const fetchWebhooks = async () => {
        if (!user?.currentWorkspaceId) return;
        try {
            setLoading(true);
            const data = await getWorkspaceWebhooks(user.currentWorkspaceId);
            setWebhooks(data);
        } catch (err: any) {
            console.error("Error fetching webhooks:", err);
            setError("Failed to load webhooks.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWebhooks();
    }, [user?.currentWorkspaceId]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this webhook?")) return;
        try {
            await deleteWebhook(id);
            setWebhooks(webhooks.filter((w) => w.id !== id));
        } catch (err) {
            console.error("Error deleting webhook:", err);
            alert("Failed to delete webhook.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Webhooks</h2>
                <button
                    onClick={onCreate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New Webhook
                </button>
            </div>

            {webhooks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-dashed">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Webhook className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No webhooks yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first webhook to start automating.</p>
                    <button
                        onClick={onCreate}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Create Webhook
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {webhooks.map((webhook) => (
                        <div
                            key={webhook.id}
                            className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors flex justify-between items-center group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${webhook.isEnabled ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                                    }`}>
                                    <Webhook className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        {webhook.name}
                                        {webhook.currentVersion && webhook.currentVersion > 1 && (
                                            <span className="text-xs font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">
                                                v{webhook.currentVersion}
                                            </span>
                                        )}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs">
                                            {webhook.httpMethod}
                                        </span>
                                        <span className="truncate max-w-xs">{webhook.endpointUrl}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onTest(webhook)}
                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                    title="Test"
                                >
                                    <TestTube className="w-4 h-4" />
                                </button>
                                {webhook.currentVersion && webhook.currentVersion > 1 && (
                                    <button
                                        onClick={() => setViewingVersions({ id: webhook.id, name: webhook.name })}
                                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                                        title="View Versions"
                                    >
                                        <History className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => onEdit(webhook)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(webhook.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Version History Modal */}
            {viewingVersions && (
                <VersionHistoryModal
                    webhookId={viewingVersions.id}
                    webhookName={viewingVersions.name}
                    onClose={() => setViewingVersions(null)}
                    onRollback={() => {
                        fetchWebhooks();
                        setViewingVersions(null);
                    }}
                />
            )}
        </div>
    );
}
