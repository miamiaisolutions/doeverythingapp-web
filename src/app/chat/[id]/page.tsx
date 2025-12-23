"use client";

import { Suspense, use } from "react";
import ChatInterface from "@/components/chat/ChatInterface";

// Use proper type for Page params
export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ChatInterface conversationId={id} />
        </Suspense>
    );
}
