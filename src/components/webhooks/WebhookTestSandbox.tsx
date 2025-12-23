"use client";

import { useState } from "react";
import { WebhookConfig } from "@/lib/firestore/types";
import { validateAllFields, isPayloadValid, getValidationErrors } from "@/lib/validation/fieldValidator";
import { X, Play, Loader2, CheckCircle, XCircle, Code, Server, Smartphone } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/client";

interface WebhookTestSandboxProps {
    webhook: WebhookConfig & { id: string };
    onClose: () => void;
}

export default function WebhookTestSandbox({ webhook, onClose }: WebhookTestSandboxProps) {
    const [testPayload, setTestPayload] = useState<string>(
        webhook.bodyTemplate || "{}"
    );
    const [testing, setTesting] = useState(false);
    const [testResults, setTestResults] = useState<{
        validationResults: any[];
        isValid: boolean;
        errors: string[];
        preview?: {
            method: string;
            url: string;
            headers: Record<string, string>;
            body: any;
        };
    } | null>(null);
    const [useServerValidation, setUseServerValidation] = useState(false);

    const handleRunTest = async () => {
        setTesting(true);

        try {
            // Parse the test payload
            const payload = JSON.parse(testPayload);

            if (useServerValidation) {
                // Server-Side Dry Run
                const executeWebhook = httpsCallable(functions, "executeWebhook");
                const result = await executeWebhook({
                    webhookId: webhook.id,
                    payload,
                    conversationId: "sandbox-test",
                    messageId: "sandbox-message",
                    dryRun: true
                });

                const data = result.data as any;

                if (data.success) {
                    setTestResults({
                        validationResults: [], // Server doesn't return granular field results in same format, assume valid
                        isValid: true,
                        errors: [],
                        preview: {
                            method: webhook.httpMethod,
                            url: webhook.endpointUrl,
                            headers: {
                                "Content-Type": "application/json",
                                ...(webhook.headers || {}),
                            },
                            body: data.data?.transformedPayload || payload,
                        }
                    });
                } else {
                    setTestResults({
                        validationResults: [],
                        isValid: false,
                        errors: [data.error || "Server validation failed"],
                        preview: undefined
                    });
                }

            } else {
                // Client-Side Validation (Existing Logic)
                const validationResults = validateAllFields(payload, webhook.fields);
                const valid = isPayloadValid(validationResults);
                const errors = getValidationErrors(validationResults);

                // Generate preview
                const preview = {
                    method: webhook.httpMethod,
                    url: webhook.endpointUrl,
                    headers: {
                        "Content-Type": "application/json",
                        ...(webhook.headers || {}),
                    },
                    body: payload,
                };

                setTestResults({
                    validationResults,
                    isValid: valid,
                    errors,
                    preview,
                });
            }
        } catch (error: any) {
            setTestResults({
                validationResults: [],
                isValid: false,
                errors: [`Error: ${error.message}`],
            });
        } finally {
            setTesting(false);
        }
    };

    const handleGenerateTestPayload = () => {
        // Generate a sample payload based on field types
        const generated: any = {};

        for (const field of webhook.fields) {
            const keys = field.key.split(".");
            let current = generated;

            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];

                if (i === keys.length - 1) {
                    // Last key - set the value
                    if (field.defaultValue) {
                        current[key] = field.defaultValue;
                    } else {
                        switch (field.type) {
                            case "string":
                                current[key] = "sample text";
                                break;
                            case "number":
                                current[key] = 42;
                                break;
                            case "boolean":
                                current[key] = true;
                                break;
                            case "array":
                                current[key] = [];
                                break;
                            case "object":
                                current[key] = {};
                                break;
                        }
                    }
                } else {
                    // Intermediate key - create nested object
                    if (!current[key]) {
                        current[key] = {};
                    }
                    current = current[key];
                }
            }
        }

        setTestPayload(JSON.stringify(generated, null, 2));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            Test Webhook
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {webhook.name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Info Banner */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex justify-between items-center">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            <strong>Dry Run Mode:</strong> This is a simulation. No actual HTTP request will be sent to the webhook endpoint.
                        </p>

                        {/* Server/Client Switch */}
                        <div className="flex items-center gap-2 bg-white dark:bg-black rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setUseServerValidation(false)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${!useServerValidation
                                    ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                    }`}
                            >
                                <Smartphone className="w-3.5 h-3.5" />
                                Client
                            </button>
                            <button
                                onClick={() => setUseServerValidation(true)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${useServerValidation
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                    }`}
                            >
                                <Server className="w-3.5 h-3.5" />
                                Server
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Left Column - Input */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Test Payload
                                </h4>
                                <button
                                    onClick={handleGenerateTestPayload}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Generate Sample
                                </button>
                            </div>
                            <textarea
                                value={testPayload}
                                onChange={(e) => setTestPayload(e.target.value)}
                                className="w-full h-96 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-lg font-mono text-sm dark:text-white"
                                placeholder="{}"
                            />
                            <button
                                onClick={handleRunTest}
                                disabled={testing}
                                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {testing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Testing...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4" />
                                        Run Test
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Right Column - Results */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Test Results
                            </h4>

                            {!testResults ? (
                                <div className="h-96 flex items-center justify-center text-gray-400 dark:text-gray-600 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                                    <div className="text-center">
                                        <Code className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Run a test to see results</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Validation Status */}
                                    <div className={`p-4 rounded-lg border ${testResults.isValid
                                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                        : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                        }`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            {testResults.isValid ? (
                                                <>
                                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                    <span className="font-medium text-green-800 dark:text-green-300">
                                                        Validation Passed
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                    <span className="font-medium text-red-800 dark:text-red-300">
                                                        Validation Failed
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        {!testResults.isValid && (
                                            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 ml-7">
                                                {testResults.errors.map((error, i) => (
                                                    <li key={i}>• {error}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    {/* HTTP Request Preview */}
                                    {testResults.preview && (
                                        <div className="space-y-2">
                                            <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                HTTP Request Preview
                                            </h5>
                                            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 font-mono text-xs space-y-2">
                                                <div>
                                                    <span className="text-blue-600 dark:text-blue-400 font-bold">
                                                        {testResults.preview.method}
                                                    </span>{" "}
                                                    <span className="text-gray-700 dark:text-gray-300">
                                                        {testResults.preview.url}
                                                    </span>
                                                </div>
                                                <div className="border-t border-gray-200 dark:border-gray-800 pt-2">
                                                    <div className="text-gray-500 dark:text-gray-500 mb-1">Headers:</div>
                                                    <pre className="text-gray-700 dark:text-gray-300 overflow-x-auto">
                                                        {JSON.stringify(testResults.preview.headers, null, 2)}
                                                    </pre>
                                                </div>
                                                {["POST", "PUT", "PATCH"].includes(testResults.preview.method) && (
                                                    <div className="border-t border-gray-200 dark:border-gray-800 pt-2">
                                                        <div className="text-gray-500 dark:text-gray-500 mb-1">Body:</div>
                                                        <pre className="text-gray-700 dark:text-gray-300 overflow-x-auto max-h-48">
                                                            {JSON.stringify(testResults.preview.body, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
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
