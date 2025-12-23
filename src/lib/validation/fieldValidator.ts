import { WebhookField, ValidationRule } from "@/lib/firestore/types";

export interface ValidationResult {
    isValid: boolean;
    fieldKey: string;
    errors: string[];
}

/**
 * Validate a single field value against its validation rules
 */
export function validateField(value: any, field: WebhookField): ValidationResult {
    const errors: string[] = [];

    // Check if required field is missing
    if (field.required && (value === undefined || value === null || value === "")) {
        errors.push(`${field.key} is required`);
        return {
            isValid: false,
            fieldKey: field.key,
            errors
        };
    }

    // Skip validation if field is optional and empty
    if (!field.required && (value === undefined || value === null || value === "")) {
        return {
            isValid: true,
            fieldKey: field.key,
            errors: []
        };
    }

    // Type validation
    const actualType = Array.isArray(value) ? "array" : typeof value;
    if (field.type === "number" && actualType !== "number") {
        errors.push(`${field.key} must be a number`);
    } else if (field.type === "string" && actualType !== "string") {
        errors.push(`${field.key} must be a string`);
    } else if (field.type === "boolean" && actualType !== "boolean") {
        errors.push(`${field.key} must be a boolean`);
    } else if (field.type === "array" && !Array.isArray(value)) {
        errors.push(`${field.key} must be an array`);
    } else if (field.type === "object" && (actualType !== "object" || Array.isArray(value))) {
        errors.push(`${field.key} must be an object`);
    }

    // Apply validation rules
    if (field.validationRules && field.validationRules.length > 0) {
        for (const rule of field.validationRules) {
            const ruleError = validateRule(value, field.key, rule);
            if (ruleError) {
                errors.push(ruleError);
            }
        }
    }

    return {
        isValid: errors.length === 0,
        fieldKey: field.key,
        errors
    };
}

/**
 * Validate a single rule
 */
function validateRule(value: any, fieldKey: string, rule: ValidationRule): string | null {
    switch (rule.type) {
        case "min":
            if (typeof value === "number" && value < rule.value) {
                return rule.message || `${fieldKey} must be at least ${rule.value}`;
            }
            if (typeof value === "string" && value.length < rule.value) {
                return rule.message || `${fieldKey} must be at least ${rule.value} characters`;
            }
            break;

        case "max":
            if (typeof value === "number" && value > rule.value) {
                return rule.message || `${fieldKey} must be at most ${rule.value}`;
            }
            if (typeof value === "string" && value.length > rule.value) {
                return rule.message || `${fieldKey} must be at most ${rule.value} characters`;
            }
            break;

        case "pattern":
            if (typeof value === "string") {
                const regex = new RegExp(rule.value);
                if (!regex.test(value)) {
                    return rule.message || `${fieldKey} does not match the required pattern`;
                }
            }
            break;

        case "enum":
            if (Array.isArray(rule.value) && !rule.value.includes(value)) {
                return rule.message || `${fieldKey} must be one of: ${rule.value.join(", ")}`;
            }
            break;

        case "custom":
            // Custom validation can be extended in the future
            break;
    }

    return null;
}

/**
 * Validate all fields in a payload
 */
export function validateAllFields(
    payload: Record<string, any>,
    fields: WebhookField[]
): ValidationResult[] {
    const results: ValidationResult[] = [];

    for (const field of fields) {
        // Handle nested fields with dot notation
        const value = getNestedValue(payload, field.key);
        const result = validateField(value, field);
        results.push(result);
    }

    return results;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
    const keys = path.split(".");
    let current = obj;

    for (const key of keys) {
        if (current === undefined || current === null) {
            return undefined;
        }
        current = current[key];
    }

    return current;
}

/**
 * Check if all validation results are valid
 */
export function isPayloadValid(results: ValidationResult[]): boolean {
    return results.every(r => r.isValid);
}

/**
 * Get all error messages from validation results
 */
export function getValidationErrors(results: ValidationResult[]): string[] {
    return results
        .filter(r => !r.isValid)
        .flatMap(r => r.errors);
}
