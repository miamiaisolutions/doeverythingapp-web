import { Timestamp } from "firebase/firestore";

export type SubscriptionTier = "free" | "pro" | "premium";

export interface User {
    email: string;
    name?: string;
    phoneNumber?: string;
    avatarUrl?: string;
    currentWorkspaceId?: string; // Active workspace for UI context
    isDeveloper?: boolean; // Has developer add-on subscription
    developerSubscriptionStatus?: string;
    stripeCustomerId?: string; // User-level Stripe customer for developer add-on
    openaiApiKey?: string; // Encrypted
    subscription?: {
        planId: SubscriptionTier;
        status: "active" | "canceled" | "past_due" | "incomplete";
        currentPeriodEnd: Timestamp;
        stripeSubscriptionId?: string;
        stripePriceId?: string;
        cancelAtPeriodEnd?: boolean;
    };
    createdAt: Timestamp;
}

export type ValidationRuleType = "min" | "max" | "pattern" | "enum" | "custom";

export interface ValidationRule {
    type: ValidationRuleType;
    value: any; // number for min/max, string for pattern, array for enum
    message?: string; // Custom error message
}

export interface WebhookField {
    key: string;
    type: "string" | "number" | "boolean" | "object" | "array";
    required: boolean;
    description?: string;
    defaultValue?: any;
    validationRules?: ValidationRule[];
}

export interface WebhookVersion {
    version: number;
    webhookId: string;
    config: Omit<WebhookConfig, "currentVersion" | "versionHistory">;
    createdAt: Timestamp;
    createdBy: string;
}

export interface WebhookConfig {
    workspaceId: string; // Workspace that owns this webhook
    createdBy: string; // User ID who created this webhook
    name: string;
    description?: string;
    documentationUrl?: string;
    endpointUrl: string;
    httpMethod: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    headers?: Record<string, string>; // Display values (masked if secure)
    secureHeaders?: Record<string, string>; // Encrypted values
    priority: number;
    isEnabled: boolean;
    bodyTemplate?: string;
    fields: WebhookField[];
    timeoutSeconds?: number; // Optional, defaults to tier max
    currentVersion: number; // Current version number
    versionHistory: string[]; // Array of version document IDs (max 2)
    createdAt: Timestamp;
    updatedAt: Timestamp;
    permissions?: WebhookPermission;
}

export interface WebhookPermission {
    allowedRoles: ("owner" | "admin" | "member")[]; // Roles that have access by default
    userExceptions: { // Specific user overrides
        userId: string;
        email: string; // Stored for display purposes
        access: "allow" | "deny";
    }[];
}

export interface Conversation {
    workspaceId: string; // Workspace context for this conversation
    userId: string; // User who owns this conversation
    title?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Message {
    conversationId: string;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt: Timestamp;
}

export type WebhookErrorType = "TIMEOUT" | "BAD_REQUEST" | "SERVER_ERROR" | "NETWORK_ERROR" | "VALIDATION_ERROR";

export interface WebhookExecution {
    workspaceId: string; // Workspace context for analytics
    userId: string;
    conversationId: string;
    messageId: string;
    webhookId: string;
    webhookName: string;
    requestPayload: Record<string, any>;
    responseStatus?: number;
    responseData?: any;
    error?: string;
    errorType?: WebhookErrorType;
    duration: number; // milliseconds
    retryCount: number;
    executedAt: Timestamp;
}

export interface WebhookExecutionResult {
    success: boolean;
    status?: number;
    data?: any;
    error?: string;
    errorType?: WebhookErrorType;
    duration: number;
}
