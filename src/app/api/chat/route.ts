import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { decrypt } from "@/lib/encryption";
import { FieldValue } from "firebase-admin/firestore";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

interface WebhookConfig {
    id: string;
    name: string;
    description?: string;
    documentationUrl?: string;
    endpointUrl: string;
    httpMethod: string;
    isEnabled: boolean;
    bodyTemplate?: string;
    fields: Array<{
        key: string;
        type: string;
        required: boolean;
        description?: string;
        defaultValue?: any;
    }>;
}

export async function POST(req: Request) {
    try {
        const { messages, conversationId } = await req.json();
        const authHeader = req.headers.get("authorization");

        if (!authHeader?.startsWith("Bearer ")) {
            return new Response("Unauthorized", { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;

        // Reject guest/anonymous users
        if (decodedToken.firebase?.sign_in_provider === 'anonymous' || userId.startsWith('guest_')) {
            return new Response("Guest users cannot use chat. Please sign in with an email account or Google.", { status: 403 });
        }

        // 1. Fetch User Settings (API Key & Persona)
        const userDoc = await adminDb.collection("users").doc(userId).get();
        const userData = userDoc.data();

        if (!userData?.openaiApiKey) {
            return new Response("OpenAI API Key not configured. Please go to Settings.", { status: 400 });
        }

        let apiKey: string;
        try {
            apiKey = decrypt(userData.openaiApiKey);
        } catch (e) {
            console.error("Failed to decrypt API key", e);
            return new Response("Invalid API Key configuration.", { status: 500 });
        }

        const systemPersona = userData.systemPersona || "";

        const currentWorkspaceId = userData.currentWorkspaceId;
        if (!currentWorkspaceId) {
            return new Response("No active workspace found.", { status: 400 });
        }

        // 2a. Fetch User's Role in Workspace
        const memberRef = adminDb.collection("workspace_members").doc(`${currentWorkspaceId}_${userId}`);
        const memberDoc = await memberRef.get();

        let userRole: "owner" | "admin" | "member" = "member"; // Default fallback
        if (memberDoc.exists) {
            userRole = memberDoc.data()?.role;
        }

        // 2b. Fetch Workspace Webhooks
        const webhooksSnapshot = await adminDb
            .collection("webhooks")
            .where("workspaceId", "==", currentWorkspaceId)
            .where("isEnabled", "==", true)
            .get();

        const allWebhooks: WebhookConfig[] = webhooksSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as unknown as WebhookConfig));

        // 2c. Filter Webhooks based on Permissions
        const authorizedWebhooks = allWebhooks.filter(webhook => {
            const perms = (webhook as any).permissions;
            if (!perms) return true; // Default allow if no permissions defined (legacy behavior)

            // Check User Exceptions first
            const userException = perms.userExceptions?.find((ex: any) =>
                ex.userId === userId || (userData.email && ex.email === userData.email)
            );

            if (userException) {
                return userException.access === "allow";
            }

            // Check Role Access
            if (perms.allowedRoles && perms.allowedRoles.includes(userRole)) {
                return true;
            }

            return false;
        });

        // 3. Generate Dynamic System Prompt
        let webhookDescriptions = "";
        if (authorizedWebhooks.length > 0) {
            webhookDescriptions = "Available Webhooks:\n" + authorizedWebhooks.map((webhook, index) => {
                const fieldsDesc = webhook.fields
                    .filter(f => f.required)
                    .map(f => `${f.key} (${f.type})${f.description ? ': ' + f.description : ''}`)
                    .join(', ');

                return `${index + 1}. ID: "${webhook.id}"
   Name: "${webhook.name}"
   Description: ${webhook.description || 'No description'}
   ${webhook.documentationUrl ? `Documentation: ${webhook.documentationUrl}` : ''}
   Required Fields: ${fieldsDesc || 'None'}`;
            }).join('\n\n');
        } else {
            webhookDescriptions = "No webhooks available or authorized for this user.";
        }

        // 4. Initialize OpenAI Provider with User's Key
        const openai = createOpenAI({
            apiKey: apiKey,
        });

        // 5. Save User Message to Firestore
        console.log(`[Chat API] Saving user message for conversation: ${conversationId}`);
        const lastMessage = messages[messages.length - 1];
        if (conversationId && lastMessage.role === 'user') {
            await adminDb
                .collection("users")
                .doc(userId)
                .collection("conversations")
                .doc(conversationId)
                .collection("messages")
                .add({
                    role: 'user',
                    content: lastMessage.content,
                    createdAt: FieldValue.serverTimestamp(),
                });

            // Update conversation timestamp (use set merge to avoid crash if doc missing)
            await adminDb
                .collection("users")
                .doc(userId)
                .collection("conversations")
                .doc(conversationId)
                .set({
                    updatedAt: FieldValue.serverTimestamp(),
                }, { merge: true });
        }

        console.log(`[Chat API] Starting OpenAI stream for conversation: ${conversationId}`);

        const result = streamText({
            model: openai('gpt-4o'),
            messages,
            system: `You are a helpful assistant that can execute webhooks to perform actions.
            
            ${systemPersona ? `USER CUSTOM INSTRUCTIONS:\n${systemPersona}\n\n` : ""}

            ${webhookDescriptions}
            
            When the user asks to perform an action that matches one of these webhooks:
            1. Identify the appropriate webhook based on the user's intent
            2. Extract the required field values from the conversation
            3. Call the 'executeWebhook' tool with the webhook ID and payload
            4. Report the results to the user
            
            If a webhook execution fails with a 400 error, analyze the error message and attempt to correct the payload if possible.`,
            tools: {
                executeWebhook: tool({
                    description: 'Execute a configured webhook with a given ID and payload.',
                    inputSchema: z.object({
                        webhookId: z.string().describe('The ID of the webhook to execute'),
                        payload: z.string().describe('The JSON payload with field values for the webhook, serialized as a valid JSON string'),
                    }),
                    execute: async ({ webhookId, payload }: { webhookId: string, payload: string }) => {
                        console.log(`[Tool] Executing webhook ${webhookId} with payload:`, payload);
                        let parsedPayload: Record<string, any>;
                        try {
                            parsedPayload = JSON.parse(payload);
                        } catch (e) {
                            console.error("[Tool] Failed to parse payload JSON:", e);
                            return {
                                success: false,
                                error: "Invalid JSON payload format",
                                errorType: "VALIDATION_ERROR"
                            };
                        }

                        try {
                            // Get Firebase project configuration
                            const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
                            const region = 'us-central1';

                            // Call the deployed Firebase Function via HTTP
                            const functionUrl = `https://${region}-${projectId}.cloudfunctions.net/executeWebhook`;

                            const response = await fetch(functionUrl, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                    data: {
                                        webhookId,
                                        payload: parsedPayload,
                                        conversationId: conversationId || '',
                                        messageId: '',
                                    }
                                }),
                            });

                            if (!response.ok) {
                                throw new Error(`Function call failed: ${response.status} ${response.statusText}`);
                            }

                            const result = await response.json();
                            const data = result.result;

                            if (data.success) {
                                return {
                                    success: true,
                                    message: `Webhook executed successfully (${data.status})`,
                                    data: data.data,
                                    duration: data.duration,
                                };
                            } else {
                                return {
                                    success: false,
                                    error: data.error,
                                    errorType: data.errorType,
                                    duration: data.duration,
                                };
                            }
                        } catch (error: any) {
                            console.error('[Tool] Webhook execution error:', error);
                            return {
                                success: false,
                                error: error.message || 'Failed to execute webhook',
                                errorType: 'NETWORK_ERROR',
                            };
                        }
                    },
                }),
            },
            onFinish: async (event: any) => {
                if (conversationId) {
                    await adminDb
                        .collection("users")
                        .doc(userId)
                        .collection("conversations")
                        .doc(conversationId)
                        .collection("messages")
                        .add({
                            role: 'assistant',
                            content: event.text,
                            toolCalls: event.toolCalls,
                            toolResults: event.toolResults,
                            createdAt: FieldValue.serverTimestamp(),
                        });
                }
            },
        } as any);

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("Chat API Error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
