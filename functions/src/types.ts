// Shared types for Firebase Functions
// This mirrors types from the main app for use in functions

export type SubscriptionTier = "free" | "pro" | "premium";

export type WebhookErrorType = "TIMEOUT" | "BAD_REQUEST" | "SERVER_ERROR" | "NETWORK_ERROR" | "VALIDATION_ERROR";

export type ValidationRuleType = "min" | "max" | "pattern" | "enum" | "custom";

export interface ValidationRule {
    type: ValidationRuleType;
    value: any;
    message?: string;
}

export interface WebhookField {
    key: string;
    type: "string" | "number" | "boolean" | "object" | "array";
    required: boolean;
    description?: string;
    defaultValue?: any;
    validationRules?: ValidationRule[];
}

export interface WebhookConfig {
    workspaceId: string;
    createdBy: string;
    name: string;
    description?: string;
    documentationUrl?: string;
    endpointUrl: string;
    httpMethod: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    headers?: Record<string, string>;
    secureHeaders?: Record<string, string>;
    priority: number;
    isEnabled: boolean;
    bodyTemplate?: string;
    fields: WebhookField[];
    timeoutSeconds?: number;
}

export interface WebhookExecutionResult {
    success: boolean;
    status?: number;
    data?: any;
    error?: string;
    errorType?: WebhookErrorType;
    duration: number;
}
