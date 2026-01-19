import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import axios, { AxiosRequestConfig } from "axios";
import { WebhookExecutionResult, WebhookConfig, SubscriptionTier } from "./types";
import { validateTimeout } from "./lib/tierConfig";
import { parseWebhookError, WebhookError } from "./lib/errorHandler";
import { transformPayload } from "./lib/payloadTransformer";
import { validateAllFields, isPayloadValid, getValidationErrors } from "./lib/fieldValidator";
import { decrypt } from "./lib/encryption";

interface ExecuteWebhookRequest {
    webhookId: string;
    payload: Record<string, any>;
    conversationId: string;
    messageId: string;
    dryRun?: boolean;
}

/**
 * Execute a webhook with the given configuration and payload
 */
export const executeWebhook = onCall(
    {
        memory: "512MiB",
        timeoutSeconds: 120,
    },
    async (request: CallableRequest<ExecuteWebhookRequest>): Promise<WebhookExecutionResult> => {
        const startTime = Date.now();

        // Verify authentication
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "User must be authenticated");
        }

        const userId = request.auth.uid;
        const { webhookId, payload, conversationId, messageId } = request.data;

        if (!webhookId || !payload) {
            throw new HttpsError("invalid-argument", "webhookId and payload are required");
        }

        try {
            // 1. Fetch webhook configuration from root collection
            const webhookDoc = await admin.firestore()
                .collection("webhooks")
                .doc(webhookId)
                .get();

            if (!webhookDoc.exists) {
                throw new HttpsError("not-found", "Webhook not found");
            }

            const webhookConfig = webhookDoc.data() as WebhookConfig;
            const workspaceId = webhookConfig.workspaceId;

            // Verify user is a member of the workspace
            // We can check workspace_members collection: document ID is usually `${workspaceId}_${userId}`
            // but let's query to be safe or valid based on how membership is stored.
            // Based on firestore.rules: /workspace_members/$(workspaceId + '_' + userId)
            const memberDoc = await admin.firestore()
                .collection("workspace_members")
                .doc(`${workspaceId}_${userId}`)
                .get();

            if (!memberDoc.exists || memberDoc.data()?.status !== 'active') {
                throw new HttpsError("permission-denied", "User is not an active member of this workspace");
            }

            if (!webhookConfig.isEnabled) {
                throw new HttpsError("failed-precondition", "Webhook is disabled");
            }

            // 2. Get workspace owner's subscription tier
            const workspaceDocRef = await admin.firestore().collection("workspaces").doc(workspaceId).get();
            if (!workspaceDocRef.exists) {
                throw new HttpsError("not-found", "Workspace not found");
            }
            const workspaceData = workspaceDocRef.data();
            const ownerId = workspaceData?.ownerId;

            let tier: SubscriptionTier = "free";

            if (ownerId) {
                const ownerDoc = await admin.firestore().collection("users").doc(ownerId).get();
                const ownerData = ownerDoc.data();
                // Check new subscription structure first, falling back to old or default
                const planId = ownerData?.subscription?.planId || "free";
                tier = planId as SubscriptionTier;
            }

            // 3. Validate and get timeout
            const timeoutSeconds = validateTimeout(tier, webhookConfig.timeoutSeconds);
            const timeoutMs = timeoutSeconds * 1000;

            // 4. Transform and validate payload
            let finalPayload: any;
            try {
                if (webhookConfig.bodyTemplate) {
                    finalPayload = transformPayload(payload, webhookConfig.bodyTemplate, webhookConfig.fields);
                } else {
                    finalPayload = payload;
                }

                // Validate the final payload using robust field validator (including min/max/enum/regex)
                const validationResults = validateAllFields(finalPayload, webhookConfig.fields);
                if (!isPayloadValid(validationResults)) {
                    const validationErrors = getValidationErrors(validationResults);
                    throw new WebhookError("VALIDATION_ERROR", `Validation failed: ${validationErrors.join("; ")}`);
                }

                // If dry run, return early with success
                if (request.data.dryRun) {
                    await logExecution(workspaceId, userId, conversationId, messageId, webhookId, webhookConfig.name, payload, null, Date.now() - startTime, 0, 200, { dryRun: true, message: "Dry run successful", transformedPayload: finalPayload });
                    return {
                        success: true,
                        status: 200,
                        data: {
                            message: "Dry run successful. Validation passed.",
                            transformedPayload: finalPayload
                        },
                        duration: Date.now() - startTime,
                    };
                }

            } catch (error: any) {
                const webhookError = error instanceof WebhookError ? error : parseWebhookError(error);
                await logExecution(workspaceId, userId, conversationId, messageId, webhookId, webhookConfig.name, payload, webhookError, Date.now() - startTime, 0);

                return {
                    success: false,
                    error: webhookError.message,
                    errorType: webhookError.errorType,
                    duration: Date.now() - startTime,
                };
            }

            // 5. Prepare HTTP request
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
                ...(webhookConfig.headers || {}),
            };

            // Decrypt and merge secure headers
            if (webhookConfig.secureHeaders) {
                try {
                    for (const [key, encryptedValue] of Object.entries(webhookConfig.secureHeaders)) {
                        headers[key] = decrypt(encryptedValue);
                    }
                } catch (err) {
                    console.error("Failed to decrypt secure headers:", err);
                    throw new HttpsError("internal", "Failed to process secure credentials");
                }
            }

            const requestConfig: AxiosRequestConfig = {
                method: webhookConfig.httpMethod,
                url: webhookConfig.endpointUrl,
                timeout: timeoutMs,
                headers,
                validateStatus: () => true, // Don't throw on any status code
            };

            // Add body for methods that support it
            if (["POST", "PUT", "PATCH"].includes(webhookConfig.httpMethod)) {
                requestConfig.data = finalPayload;
            } else if (webhookConfig.httpMethod === "GET" && Object.keys(finalPayload).length > 0) {
                requestConfig.params = finalPayload;
            }

            // 6. Execute webhook
            let response;
            try {
                response = await axios(requestConfig);
            } catch (error: any) {
                const webhookError = parseWebhookError(error);
                await logExecution(workspaceId, userId, conversationId, messageId, webhookId, webhookConfig.name, finalPayload, webhookError, Date.now() - startTime, 0);

                return {
                    success: false,
                    error: webhookError.message,
                    errorType: webhookError.errorType,
                    duration: Date.now() - startTime,
                };
            }

            // 7. Process response
            const duration = Date.now() - startTime;
            const success = response.status >= 200 && response.status < 300;

            if (success) {
                await logExecution(workspaceId, userId, conversationId, messageId, webhookId, webhookConfig.name, finalPayload, null, duration, 0, response.status, response.data);

                return {
                    success: true,
                    status: response.status,
                    data: response.data,
                    duration,
                };
            } else {
                // Non-2xx response
                const error = new WebhookError(
                    response.status === 400 ? "BAD_REQUEST" : "SERVER_ERROR",
                    `HTTP ${response.status}: ${typeof response.data === "string" ? response.data : JSON.stringify(response.data)}`,
                    response.status,
                    response.data
                );

                await logExecution(workspaceId, userId, conversationId, messageId, webhookId, webhookConfig.name, finalPayload, error, duration, 0, response.status, response.data);

                return {
                    success: false,
                    status: response.status,
                    error: error.message,
                    errorType: error.errorType,
                    duration,
                };
            }
        } catch (error: any) {
            console.error("Webhook execution error:", error);
            const duration = Date.now() - startTime;

            return {
                success: false,
                error: error.message || "Unknown error occurred",
                errorType: "NETWORK_ERROR",
                duration,
            };
        }
    });

/**
 * Log webhook execution to Firestore
 */
async function logExecution(
    workspaceId: string,
    userId: string,
    conversationId: string,
    messageId: string,
    webhookId: string,
    webhookName: string,
    payload: any,
    error: WebhookError | null,
    duration: number,
    retryCount: number,
    status?: number,
    responseData?: any
): Promise<void> {
    try {
        await admin.firestore().collection("webhook_executions").add({
            workspaceId,
            userId,
            conversationId,
            messageId,
            webhookId,
            webhookName,
            requestPayload: payload,
            responseStatus: status,
            responseData: responseData,
            error: error?.message,
            errorType: error?.errorType,
            duration,
            retryCount,
            executedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (logError) {
        console.error("Failed to log webhook execution:", logError);
        // Don't throw - logging failure shouldn't break the execution
    }
}
