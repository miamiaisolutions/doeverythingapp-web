import { WebhookField } from "../types";
import { WebhookError } from "./errorHandler";

/**
 * Validate payload against webhook field definitions
 */
export function validatePayload(payload: any, fields: WebhookField[]): void {
    const errors: string[] = [];

    for (const field of fields) {
        const value = getNestedValue(payload, field.key);

        // Check required fields
        if (field.required && (value === undefined || value === null || value === "")) {
            errors.push(`Required field '${field.key}' is missing`);
            continue;
        }

        // Skip type validation if field is not present and not required
        if (value === undefined || value === null) {
            continue;
        }

        // Validate field types
        const actualType = getValueType(value);
        if (actualType !== field.type) {
            errors.push(`Field '${field.key}' should be ${field.type} but got ${actualType}`);
        }
    }

    if (errors.length > 0) {
        throw new WebhookError("VALIDATION_ERROR", errors.join("; "));
    }
}

/**
 * Transform AI-extracted values into webhook payload using template
 */
export function transformPayload(
    aiValues: Record<string, any>,
    bodyTemplate: string,
    fields: WebhookField[]
): Record<string, any> {
    // Parse the template
    let template: any;
    try {
        template = JSON.parse(bodyTemplate);
    } catch (e) {
        throw new WebhookError("VALIDATION_ERROR", "Invalid JSON template");
    }

    // Create a copy of the template
    const payload = JSON.parse(JSON.stringify(template));

    // Apply AI values and defaults
    for (const field of fields) {
        const aiValue = aiValues[field.key];
        const valueToUse = aiValue !== undefined ? aiValue : field.defaultValue;

        if (valueToUse !== undefined) {
            setNestedValue(payload, field.key, valueToUse);
        }
    }

    return payload;
}

/**
 * Apply default values for missing optional fields
 */
export function applyDefaults(payload: any, fields: WebhookField[]): any {
    const result = { ...payload };

    for (const field of fields) {
        if (!field.required && field.defaultValue !== undefined) {
            const currentValue = getNestedValue(result, field.key);
            if (currentValue === undefined || currentValue === null) {
                setNestedValue(result, field.key, field.defaultValue);
            }
        }
    }

    return result;
}

/**
 * Get nested value from object using dot notation (e.g., "user.address.city")
 */
function getNestedValue(obj: any, path: string): any {
    const keys = path.split(".");
    let current = obj;

    for (const key of keys) {
        if (current === null || current === undefined) {
            return undefined;
        }
        current = current[key];
    }

    return current;
}

/**
 * Set nested value in object using dot notation
 */
function setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split(".");
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== "object") {
            current[key] = {};
        }
        current = current[key];
    }

    current[keys[keys.length - 1]] = value;
}

/**
 * Get the type of a value for validation
 */
function getValueType(value: any): string {
    if (Array.isArray(value)) return "array";
    if (value === null) return "null";
    const type = typeof value;
    if (type === "object") return "object";
    return type;
}
