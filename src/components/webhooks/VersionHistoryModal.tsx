"use client";

import { useState, useEffect } from "react";
import { WebhookVersion } from "@/lib/firestore/types";
import { getWebhookVersions, rollbackWebhookVersion } from "@/lib/firestore/webhooks";
import { X, Clock, RotateCcw, Loader2 } from "lucide-react";

interface VersionHistoryModalProps {
    webhookId: string;
    webhookName: string;
    onClose: () => void;
    onRollback: () => void;
}

export default function VersionHistoryModal({
    webhookId,
    webhookName,
    onClose,
    onRollback,
}: VersionHistoryModalProps) {
    const [versions, setVersions] = useState<(WebhookVersion & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [rollingBack, setRollingBack] = useState(false);

    useEffect(() => {
        loadVersions();
    }, [webhookId]);

    const loadVersions = async () => {
        try {
            setLoading(true);
            const data = await getWebhookVersions(webhookId);
            setVersions(data);
        } catch (error) {
            console.error("Failed to load versions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRollback = async (versionId: string, versionNumber: number) => {
        if (!confirm(`Rollback to version ${versionNumber}? This will create a new version with the old configuration.`)) {
            return;
        }

        try {
            setRollingBack(true);
            await rollbackWebhookVersion(webhookId, versionId);
            onRollback();
            onClose();
        } catch (error) {
            console.error("Failed to rollback:", error);
            alert("Failed to rollback to this version");
        } finally {
            setRollingBack(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Version History
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {webhookName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex justify-center items-center h-32">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                    ) : versions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No version history available yet</p>
                            <p className="text-sm mt-1">Versions are created when you edit the webhook</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {versions.map((version, index) => (
                                <div
                                    key={version.id}
                                    className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-mono text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">
                                                    v{version.version}
                                                </span>
                                                {index === 0 && (
                                                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                                                        Previous Version
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                <p>
                                                    <span className="font-medium">Name:</span> {version.config.name}
                                                </p>
                                                <p>
                                                    <span className="font-medium">Endpoint:</span>{" "}
                                                    <span className="font-mono text-xs">{version.config.endpointUrl}</span>
                                                </p>
                                                <p>
                                                    <span className="font-medium">Method:</span>{" "}
                                                    <span className="font-mono text-xs">{version.config.httpMethod}</span>
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                                    <Clock className="w-3 h-3 inline mr-1" />
                                                    {version.createdAt?.toDate?.()?.toLocaleString() || "Unknown"}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRollback(version.id, version.version)}
                                            disabled={rollingBack}
                                            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                        >
                                            {rollingBack ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <RotateCcw className="w-3.5 h-3.5" />
                                            )}
                                            Rollback
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
