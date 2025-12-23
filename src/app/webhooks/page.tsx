"use client";

import { useState } from "react";
import ProtectedLayout from "@/components/layouts/ProtectedLayout";
import WebhookList from "@/components/webhooks/WebhookList";
import WebhookForm from "@/components/webhooks/WebhookForm";
import WebhookTestSandbox from "@/components/webhooks/WebhookTestSandbox";
import { WebhookConfig } from "@/lib/firestore/types";
import { createWebhook, updateWebhook } from "@/lib/firestore/webhooks";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function WebhooksPage() {
    const { user } = useAuth();
    const { currentWorkspaceId } = useWorkspace();
    const [view, setView] = useState<"list" | "form" | "test">("list");
    const [editingWebhook, setEditingWebhook] = useState<(WebhookConfig & { id: string }) | undefined>(undefined);
    const [testingWebhook, setTestingWebhook] = useState<(WebhookConfig & { id: string }) | undefined>(undefined);

    const handleCreate = () => {
        setEditingWebhook(undefined);
        setView("form");
    };

    const handleEdit = (webhook: WebhookConfig & { id: string }) => {
        setEditingWebhook(webhook);
        setView("form");
    };

    const handleTest = (webhook: WebhookConfig & { id: string }) => {
        setTestingWebhook(webhook);
        setView("test");
    };

    const handleSave = async (data: Omit<WebhookConfig, "createdAt" | "updatedAt" | "currentVersion" | "versionHistory">) => {
        if (!user || !currentWorkspaceId) {
            alert("Please wait for workspace to load");
            return;
        }

        try {
            if (editingWebhook) {
                await updateWebhook(editingWebhook.id, {
                    ...data,
                    workspaceId: currentWorkspaceId,
                    createdBy: editingWebhook.createdBy || user.uid // Preserve original creator
                });
            } else {
                await createWebhook({
                    ...data,
                    workspaceId: currentWorkspaceId,
                    createdBy: user.uid
                });
            }
            setView("list");
        } catch (error) {
            console.error("Failed to save webhook", error);
            alert("Failed to save webhook");
        }
    };

    return (
        <ProtectedLayout>
            <div className="p-8 max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Webhooks</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Manage your webhooks and automation triggers.
                    </p>
                </div>

                {view === "list" ? (
                    <WebhookList onCreate={handleCreate} onEdit={handleEdit} onTest={handleTest} />
                ) : view === "form" ? (
                    <WebhookForm
                        initialData={editingWebhook}
                        onSave={handleSave}
                        onCancel={() => setView("list")}
                    />
                ) : (
                    testingWebhook && (
                        <WebhookTestSandbox
                            webhook={testingWebhook}
                            onClose={() => setView("list")}
                        />
                    )
                )}
            </div>
        </ProtectedLayout>
    );
}
