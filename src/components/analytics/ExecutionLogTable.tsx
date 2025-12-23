"use client";

import { WebhookExecution } from "@/lib/firestore/types";
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

interface ExecutionLogTableProps {
    executions: (WebhookExecution & { executedAt: Date })[];
}

export default function ExecutionLogTable({ executions }: ExecutionLogTableProps) {
    if (executions.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-white/5 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/10">
                <p>No executions found for this period.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50 dark:bg-white/5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity Log</h3>
                <span className="text-xs text-orange-600 dark:text-orange-400 font-medium bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 px-2 py-1 rounded-full">
                    Last {executions.length} Events
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-white/10">
                        <tr>
                            <th className="px-6 py-3 w-10">Status</th>
                            <th className="px-6 py-3">Time</th>
                            <th className="px-6 py-3">Webhook</th>
                            <th className="px-6 py-3">Details</th>
                            <th className="px-6 py-3 text-right">Duration</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                        {executions.map((exec, idx) => {
                            const isSuccess = exec.responseStatus && exec.responseStatus >= 200 && exec.responseStatus < 300;
                            const isError = !isSuccess;

                            return (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-3">
                                        {isSuccess ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-500" />
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {exec.executedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {exec.executedAt.toLocaleDateString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {exec.webhookName || "Unknown Webhook"}
                                            </span>
                                            <span className="text-xs font-mono text-gray-500">
                                                {exec.webhookId.substring(0, 8)}...
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        {isError ? (
                                            <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-2 py-1 rounded text-xs w-fit">
                                                <AlertCircle className="w-3 h-3" />
                                                <span className="max-w-[150px] truncate" title={exec.error || exec.errorType}>
                                                    {exec.error || exec.errorType || `Error ${exec.responseStatus}`}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 px-2 py-1 rounded text-xs w-fit">
                                                <span className="font-mono">HTTP {exec.responseStatus}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-right text-gray-600 dark:text-gray-400 font-mono text-xs">
                                        {exec.duration}ms
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
