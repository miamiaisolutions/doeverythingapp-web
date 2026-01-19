import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { WebhookConfig, WebhookVersion } from "./types";


export async function getWorkspaceWebhooks(workspaceId: string): Promise<(WebhookConfig & { id: string })[]> {
    const q = query(
        collection(db, "webhooks"),
        where("workspaceId", "==", workspaceId)
    );
    const snapshot = await getDocs(q);
    const webhooks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as (WebhookConfig & { id: string })[];

    return webhooks.sort((a, b) => (a.priority || 0) - (b.priority || 0));
}

import { Workspace, TIER_LIMITS } from "./workspaceTypes";

export async function createWebhook(
    webhookData: Omit<WebhookConfig, "createdAt" | "updatedAt" | "currentVersion" | "versionHistory">
): Promise<string> {
    // 1. Fetch Workspace to check tier
    const workspaceRef = doc(db, "workspaces", webhookData.workspaceId);
    const workspaceDoc = await getDoc(workspaceRef);
    if (!workspaceDoc.exists()) {
        throw new Error("Workspace not found");
    }
    const workspace = workspaceDoc.data() as Workspace;

    // Fetch owner to get subscription tier
    const ownerRef = doc(db, "users", workspace.ownerId);
    const ownerDoc = await getDoc(ownerRef);
    const ownerData = ownerDoc.data() as any; // Cast to access new subscription field

    // Default to free if no sub
    const planId = ownerData?.subscription?.planId || 'free';
    const limits = TIER_LIMITS[planId as keyof typeof TIER_LIMITS] || TIER_LIMITS['free'];

    // 2. Count existing webhooks
    const q = query(
        collection(db, "webhooks"),
        where("workspaceId", "==", webhookData.workspaceId)
    );
    const snapshot = await getDocs(q);
    const currentCount = snapshot.size;

    if (currentCount >= limits.maxWebhooks) {
        throw new Error(`Upgrade your plan to add more webhooks. Limit for ${planId} plan is ${limits.maxWebhooks}.`);
    }

    const docRef = await addDoc(collection(db, "webhooks"), {
        ...webhookData,
        currentVersion: 1,
        versionHistory: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
    return docRef.id;
}

export async function updateWebhook(
    webhookId: string,
    data: Partial<WebhookConfig>
): Promise<void> {
    const webhookRef = doc(db, "webhooks", webhookId);
    const webhookDoc = await getDoc(webhookRef);

    if (!webhookDoc.exists()) {
        throw new Error("Webhook not found");
    }

    const currentWebhook = webhookDoc.data() as WebhookConfig;
    const newVersion = (currentWebhook.currentVersion || 1) + 1;

    // Create version snapshot
    const versionData: Omit<WebhookVersion, "createdAt"> = {
        version: currentWebhook.currentVersion || 1,
        webhookId: webhookId,
        config: {
            workspaceId: currentWebhook.workspaceId,
            createdBy: currentWebhook.createdBy,
            name: currentWebhook.name,
            description: currentWebhook.description,
            documentationUrl: currentWebhook.documentationUrl,
            endpointUrl: currentWebhook.endpointUrl,
            httpMethod: currentWebhook.httpMethod,
            headers: currentWebhook.headers,
            priority: currentWebhook.priority,
            isEnabled: currentWebhook.isEnabled,
            bodyTemplate: currentWebhook.bodyTemplate,
            fields: currentWebhook.fields,
            timeoutSeconds: currentWebhook.timeoutSeconds,
            createdAt: currentWebhook.createdAt,
            updatedAt: currentWebhook.updatedAt,
        },
        createdBy: currentWebhook.createdBy,
    };

    const versionRef = await addDoc(
        collection(db, "webhooks", webhookId, "versions"),
        {
            ...versionData,
            createdAt: Timestamp.now(),
        }
    );

    // Update version history (keep only last 2)
    const versionHistory = [...(currentWebhook.versionHistory || []), versionRef.id];

    // Delete old versions if more than 2
    if (versionHistory.length > 2) {
        const versionsToDelete = versionHistory.slice(0, versionHistory.length - 2);
        const batch = writeBatch(db);

        for (const versionId of versionsToDelete) {
            const oldVersionRef = doc(db, "webhooks", webhookId, "versions", versionId);
            batch.delete(oldVersionRef);
        }

        await batch.commit();

        // Keep only last 2 in history
        versionHistory.splice(0, versionHistory.length - 2);
    }

    // Update webhook with new data and version info
    await updateDoc(webhookRef, {
        ...data,
        currentVersion: newVersion,
        versionHistory: versionHistory,
        updatedAt: Timestamp.now(),
    });
}

export async function deleteWebhook(webhookId: string): Promise<void> {
    // Delete all versions first
    const versionsSnapshot = await getDocs(
        collection(db, "webhooks", webhookId, "versions")
    );

    const batch = writeBatch(db);
    versionsSnapshot.docs.forEach((versionDoc) => {
        batch.delete(versionDoc.ref);
    });

    // Delete the webhook itself
    batch.delete(doc(db, "webhooks", webhookId));

    await batch.commit();
}

export async function getWebhookVersions(
    webhookId: string
): Promise<(WebhookVersion & { id: string })[]> {
    const versionsSnapshot = await getDocs(
        query(
            collection(db, "webhooks", webhookId, "versions"),
            orderBy("version", "desc")
        )
    );

    return versionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as (WebhookVersion & { id: string })[];
}

export async function getWebhookVersion(
    webhookId: string,
    versionId: string
): Promise<WebhookVersion | null> {
    const versionDoc = await getDoc(
        doc(db, "webhooks", webhookId, "versions", versionId)
    );

    if (!versionDoc.exists()) {
        return null;
    }

    return versionDoc.data() as WebhookVersion;
}

export async function rollbackWebhookVersion(
    webhookId: string,
    versionId: string
): Promise<void> {
    const version = await getWebhookVersion(webhookId, versionId);

    if (!version) {
        throw new Error("Version not found");
    }

    // Update webhook with version's config (this will create a new version)
    await updateWebhook(webhookId, version.config);
}
