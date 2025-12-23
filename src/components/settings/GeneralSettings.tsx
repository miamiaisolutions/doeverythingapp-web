"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Moon, Sun, Monitor, Bell } from "lucide-react";

export default function GeneralSettings() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="space-y-6">
            {/* Theme Preferences */}
            <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center gap-3 bg-gray-50 dark:bg-white/5">
                    <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-lg">
                        <Monitor className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Customize how the app looks on your device.</p>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button
                            onClick={() => setTheme("light")}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${theme === 'light'
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
                                : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                        >
                            <Sun className={`w-6 h-6 ${theme === 'light' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`} />
                            <span className={`text-sm font-medium ${theme === 'light' ? 'text-orange-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>Light</span>
                        </button>

                        <button
                            onClick={() => setTheme("dark")}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${theme === 'dark'
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
                                : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                        >
                            <Moon className={`w-6 h-6 ${theme === 'dark' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`} />
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-orange-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>Dark</span>
                        </button>

                        <button
                            onClick={() => setTheme("system")}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${theme === 'system'
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
                                : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                        >
                            <Monitor className={`w-6 h-6 ${theme === 'system' ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`} />
                            <span className={`text-sm font-medium ${theme === 'system' ? 'text-orange-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>System</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Notifications (UI Only) */}
            <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center gap-3 bg-gray-50 dark:bg-white/5">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                        <Bell className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your email preferences.</p>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-3">
                        <input type="checkbox" id="security-emails" defaultChecked className="mt-1 rounded border-gray-300 text-orange-600 focus:ring-orange-500 accent-orange-500" />
                        <div>
                            <label htmlFor="security-emails" className="block text-sm font-medium text-gray-900 dark:text-white">Security Alerts</label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Get notified about new sign-ins and password resets.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <input type="checkbox" id="product-updates" className="mt-1 rounded border-gray-300 text-orange-600 focus:ring-orange-500 accent-orange-500" />
                        <div>
                            <label htmlFor="product-updates" className="block text-sm font-medium text-gray-900 dark:text-white">Product Updates</label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Receive news about new features and improvements.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
