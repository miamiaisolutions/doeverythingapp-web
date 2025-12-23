"use client";

import { useState } from "react";
import { ValidationRule, ValidationRuleType } from "@/lib/firestore/types";
import { X, Plus } from "lucide-react";

interface ValidationRuleModalProps {
    fieldKey: string;
    existingRules: ValidationRule[];
    onSave: (rules: ValidationRule[]) => void;
    onClose: () => void;
}

export default function ValidationRuleModal({
    fieldKey,
    existingRules,
    onSave,
    onClose,
}: ValidationRuleModalProps) {
    const [rules, setRules] = useState<ValidationRule[]>(existingRules);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [ruleType, setRuleType] = useState<ValidationRuleType>("min");
    const [ruleValue, setRuleValue] = useState<string>("");
    const [ruleMessage, setRuleMessage] = useState<string>("");

    const handleAddRule = () => {
        let parsedValue: any = ruleValue;

        // Parse value based on type
        if (ruleType === "min" || ruleType === "max") {
            parsedValue = parseFloat(ruleValue);
            if (isNaN(parsedValue)) {
                alert("Please enter a valid number");
                return;
            }
        } else if (ruleType === "enum") {
            parsedValue = ruleValue.split(",").map((v) => v.trim());
        }

        const newRule: ValidationRule = {
            type: ruleType,
            value: parsedValue,
            message: ruleMessage || undefined,
        };

        if (editingIndex !== null) {
            const updatedRules = [...rules];
            updatedRules[editingIndex] = newRule;
            setRules(updatedRules);
            setEditingIndex(null);
        } else {
            setRules([...rules, newRule]);
        }

        // Reset form
        setRuleValue("");
        setRuleMessage("");
    };

    const handleEditRule = (index: number) => {
        const rule = rules[index];
        setEditingIndex(index);
        setRuleType(rule.type);

        if (rule.type === "enum" && Array.isArray(rule.value)) {
            setRuleValue(rule.value.join(", "));
        } else {
            setRuleValue(String(rule.value));
        }

        setRuleMessage(rule.message || "");
    };

    const handleDeleteRule = (index: number) => {
        setRules(rules.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        onSave(rules);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Validation Rules for "{fieldKey}"
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Existing Rules */}
                    {rules.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Current Rules
                            </h4>
                            <div className="space-y-2">
                                {rules.map((rule, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
                                                {rule.type}
                                            </span>
                                            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                                {Array.isArray(rule.value)
                                                    ? rule.value.join(", ")
                                                    : rule.value}
                                            </span>
                                            {rule.message && (
                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                    {rule.message}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditRule(index)}
                                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRule(index)}
                                                className="text-xs text-red-600 dark:text-red-400 hover:underline"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add/Edit Rule Form */}
                    <div className="space-y-4 border-t border-gray-200 dark:border-gray-800 pt-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {editingIndex !== null ? "Edit Rule" : "Add New Rule"}
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm text-gray-600 dark:text-gray-400">
                                    Rule Type
                                </label>
                                <select
                                    value={ruleType}
                                    onChange={(e) => setRuleType(e.target.value as ValidationRuleType)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm dark:text-white"
                                >
                                    <option value="min">Minimum (number/length)</option>
                                    <option value="max">Maximum (number/length)</option>
                                    <option value="pattern">Pattern (regex)</option>
                                    <option value="enum">Enum (allowed values)</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm text-gray-600 dark:text-gray-400">
                                    Value
                                    {ruleType === "enum" && (
                                        <span className="text-xs ml-1">(comma-separated)</span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    value={ruleValue}
                                    onChange={(e) => setRuleValue(e.target.value)}
                                    placeholder={
                                        ruleType === "enum"
                                            ? "active, inactive, pending"
                                            : ruleType === "pattern"
                                                ? "^[a-z]+$"
                                                : "10"
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm font-mono dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-gray-600 dark:text-gray-400">
                                Custom Error Message (optional)
                            </label>
                            <input
                                type="text"
                                value={ruleMessage}
                                onChange={(e) => setRuleMessage(e.target.value)}
                                placeholder="e.g. Age must be at least 18"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-sm dark:text-white"
                            />
                        </div>

                        <button
                            onClick={handleAddRule}
                            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            {editingIndex !== null ? "Update Rule" : "Add Rule"}
                        </button>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Save Rules
                    </button>
                </div>
            </div>
        </div>
    );
}
