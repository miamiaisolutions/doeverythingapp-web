"use client";
import { useEffect, useState } from "react";
import { Activity, Clock, AlertCircle, BarChart as ChartIcon } from "lucide-react";
import ProtectedLayout from "@/components/layouts/ProtectedLayout";
import { useAuth } from "@/hooks/useAuth";
import { getWorkspaceAnalytics, DashboardAnalytics } from "@/lib/firestore/analytics";
import DateRangeSelector from "@/components/analytics/DateRangeSelector";
import ExecutionLogTable from "@/components/analytics/ExecutionLogTable";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    BarChart,
    Bar
} from "recharts";

const COLORS = ["#f97316", "#ef4444", "#eab308", "#3b82f6"];

export default function DashboardPage() {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(7);

    useEffect(() => {
        async function fetchAnalytics() {
            if (user && !user.currentWorkspaceId) {
                setLoading(false);
                return;
            }

            if (user?.currentWorkspaceId) {
                try {
                    setLoading(true);
                    const data = await getWorkspaceAnalytics(user.currentWorkspaceId, days);
                    setAnalytics(data);
                } catch (error) {
                    console.error("Failed to fetch analytics:", error);
                } finally {
                    setLoading(false);
                }
            }
        }

        if (user) {
            fetchAnalytics();
        }
    }, [user?.uid, user?.currentWorkspaceId, days]);

    // Loading State
    if (loading && !analytics) {
        return (
            <ProtectedLayout>
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </ProtectedLayout>
        );
    }

    return (
        <ProtectedLayout>
            <div className="p-8 space-y-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Analytics</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Real-time insights into your webhook performance.</p>
                    </div>
                    <DateRangeSelector days={days} onChange={setDays} />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: "Total Executions", value: analytics?.totalExecutions.toString() || "0", icon: Activity, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20" },
                        { label: "Success Rate", value: analytics?.successRate || "0%", icon: ChartIcon, color: "text-green-500", bg: "bg-green-100 dark:bg-green-500/10 border-green-200 dark:border-green-500/20" },
                        { label: "Avg. Latency", value: analytics?.avgLatency || "0ms", icon: Clock, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20" },
                        { label: "Errors", value: analytics?.errorCount.toString() || "0", icon: AlertCircle, color: "text-red-500", bg: "bg-red-100 dark:bg-red-500/10 border-red-200 dark:border-red-500/20" },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-white/5 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 flex items-center gap-4 hover:shadow-md transition-all">
                            <div className={`p-3 rounded-xl border ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Activity Chart */}
                    <div className="bg-white dark:bg-white/5 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Webhook Activity</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analytics?.activityData || []}>
                                    <defs>
                                        <linearGradient id="colorExecutions" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} dx={-10} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "12px", color: "#fff", padding: "12px" }}
                                        itemStyle={{ color: "#f97316" }}
                                        cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                    <Area type="monotone" dataKey="executions" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorExecutions)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Success Rate Chart */}
                    <div className="bg-white dark:bg-white/5 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Success vs. Failure</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={analytics?.successData || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {(analytics?.successData || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "12px", color: "#fff", padding: "12px" }}
                                        itemStyle={{ color: "#fff" }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Latency Chart */}
                <div className="bg-white dark:bg-white/5 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Average Latency (ms)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics?.latencyData || []}>
                                <XAxis dataKey="webhook" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.05)', radius: 4 }}
                                    contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "12px", color: "#fff", padding: "12px" }}
                                    itemStyle={{ color: "#fff" }}
                                />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                <Bar dataKey="latency" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40}>
                                    {analytics?.latencyData?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#f97316" : "#fb923c"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Executions Table */}
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    <ExecutionLogTable executions={analytics?.recentExecutions || []} />
                </div>
            </div>
        </ProtectedLayout>
    );
}
