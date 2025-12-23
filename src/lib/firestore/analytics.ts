import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    Timestamp,
    limit
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { WebhookExecution, WebhookErrorType } from "./types";

export interface DashboardAnalytics {
    totalExecutions: number;
    successRate: string;
    avgLatency: string;
    errorCount: number;
    activityData: {
        date: string;
        executions: number;
    }[];
    successData: {
        name: string;
        value: number;
    }[];
    latencyData: {
        webhook: string;
        latency: number;
    }[];
    recentExecutions: (WebhookExecution & { executedAt: Date })[];
}

export async function getWorkspaceAnalytics(workspaceId: string, daysIdx: number = 7): Promise<DashboardAnalytics> {
    // Determine start date
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - daysIdx);

    const executionsRef = collection(db, "webhook_executions");
    const q = query(
        executionsRef,
        where("workspaceId", "==", workspaceId),
        where("executedAt", ">=", Timestamp.fromDate(startDate)),
        orderBy("executedAt", "desc")
    );

    const snapshot = await getDocs(q);
    const executions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            executedAt: data.executedAt?.toDate() // Convert Timestamp to Date
        } as WebhookExecution & { executedAt: Date };
    });

    // 1. Calculate Stats
    const totalExecutions = executions.length;

    const successfulExecutions = executions.filter(e =>
        e.responseStatus && e.responseStatus >= 200 && e.responseStatus < 300
    ).length;

    const errorExecutions = executions.filter(e =>
        !e.responseStatus || e.responseStatus >= 400
    ).length;

    const successRate = totalExecutions > 0
        ? Math.round((successfulExecutions / totalExecutions) * 100) + "%"
        : "0%";

    const totalLatency = executions.reduce((sum, e) => sum + (e.duration || 0), 0);
    const avgLatency = totalExecutions > 0
        ? Math.round(totalLatency / totalExecutions) + "ms"
        : "0ms";

    // 2. Activity Data
    const activityMap = new Map<string, number>();

    // Initialize last N days with 0
    for (let i = daysIdx - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        // If range > 30 days, maybe use MM/DD format? For now keeping "short weekday" or "MM/DD"
        // Let's use MM/DD for clarity across larger ranges
        const dayKey = d.toLocaleDateString("en-US", { month: 'numeric', day: 'numeric' });
        activityMap.set(dayKey, 0);
    }

    executions.forEach(e => {
        const dayKey = e.executedAt.toLocaleDateString("en-US", { month: 'numeric', day: 'numeric' });
        // Only count if within our initialized map (though query handles this, safety check)
        if (activityMap.has(dayKey)) {
            activityMap.set(dayKey, (activityMap.get(dayKey) || 0) + 1);
        }
    });

    const activityData = Array.from(activityMap.entries()).map(([date, count]) => ({
        date,
        executions: count
    }));

    // 3. Success vs Failed PIE Chart
    const successData = [
        { name: "Success", value: successfulExecutions },
        { name: "Failed", value: errorExecutions }
    ];

    // 4. Latency by Webhook (Top 5 active ones ideally, or just recent)
    // Let's group by webhookName and avg latency
    const webhookLatencies = new Map<string, { total: number, count: number }>();

    executions.forEach(e => {
        const name = e.webhookName || "Unknown";
        const current = webhookLatencies.get(name) || { total: 0, count: 0 };
        webhookLatencies.set(name, {
            total: current.total + (e.duration || 0),
            count: current.count + 1
        });
    });

    const latencyData = Array.from(webhookLatencies.entries())
        .map(([webhook, data]) => ({
            webhook,
            latency: Math.round(data.total / data.count)
        }))
        .slice(0, 5); // Start with top 5

    // 5. Recent Executions (limit to 50 for table)
    const recentExecutions = executions.slice(0, 50);

    return {
        totalExecutions,
        successRate,
        avgLatency,
        errorCount: errorExecutions,
        activityData,
        successData,
        latencyData,
        recentExecutions
    };
}
