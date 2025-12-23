import { WebhookErrorType } from "../types";

export class WebhookError extends Error {
    constructor(
        public errorType: WebhookErrorType,
        message: string,
        public statusCode?: number,
        public responseData?: any
    ) {
        super(message);
        this.name = "WebhookError";
    }
}

/**
 * Parse axios/network errors into structured WebhookError
 */
export function parseWebhookError(error: any): WebhookError {
    // Timeout error
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        return new WebhookError("TIMEOUT", "Webhook request timed out");
    }

    // Network errors (DNS, connection refused, etc.)
    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
        return new WebhookError("NETWORK_ERROR", `Network error: ${error.message}`);
    }

    // HTTP response errors
    if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 400) {
            return new WebhookError(
                "BAD_REQUEST",
                `Bad Request: ${typeof data === "string" ? data : JSON.stringify(data)}`,
                status,
                data
            );
        }

        if (status >= 500) {
            return new WebhookError(
                "SERVER_ERROR",
                `Server Error (${status}): ${typeof data === "string" ? data : JSON.stringify(data)}`,
                status,
                data
            );
        }

        // Other HTTP errors (401, 403, 404, etc.)
        return new WebhookError(
            "SERVER_ERROR",
            `HTTP Error (${status}): ${typeof data === "string" ? data : JSON.stringify(data)}`,
            status,
            data
        );
    }

    // Unknown error
    return new WebhookError("NETWORK_ERROR", error.message || "Unknown error occurred");
}

/**
 * Determine if error qualifies for Smart Error Recovery (only 400 Bad Request)
 */
export function isRetryableError(error: WebhookError): boolean {
    return error.errorType === "BAD_REQUEST";
}

/**
 * Format error message for AI context
 */
export function formatErrorForAI(error: WebhookError): string {
    switch (error.errorType) {
        case "TIMEOUT":
            return "The webhook request timed out. The endpoint took too long to respond.";
        case "BAD_REQUEST":
            return `The webhook returned a 400 Bad Request error. Details: ${error.message}. Please analyze the error and correct the payload if possible.`;
        case "SERVER_ERROR":
            return `The webhook server returned an error (${error.statusCode}). This is likely a server-side issue. Details: ${error.message}`;
        case "NETWORK_ERROR":
            return `Could not connect to the webhook endpoint. Details: ${error.message}`;
        case "VALIDATION_ERROR":
            return `Payload validation failed: ${error.message}`;
        default:
            return `An error occurred: ${error.message}`;
    }
}
