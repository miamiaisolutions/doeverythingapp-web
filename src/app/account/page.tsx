"use client";

import ProtectedLayout from "@/components/layouts/ProtectedLayout";

export default function AccountPage() {
    return (
        <ProtectedLayout>
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">Account</h1>
                <p className="text-gray-600">Manage your account settings here.</p>
            </div>
        </ProtectedLayout>
    );
}
