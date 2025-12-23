"use client";

import { useEffect, useState } from "react";

const codeSample = `{
  "action": "refund_user",
  "data": {
    "user_id": "usr_942",
    "amount": 49.00,
    "reason": "latency_SLA"
  }
}`;

export default function LiveCode() {
    const [displayedCode, setDisplayedCode] = useState("");

    useEffect(() => {
        let index = 0;
        let timeout: NodeJS.Timeout;

        const type = () => {
            setDisplayedCode(codeSample.substring(0, index));
            index++;

            if (index <= codeSample.length) {
                timeout = setTimeout(type, Math.random() * 50 + 30); // Random typing speed
            } else {
                timeout = setTimeout(() => {
                    index = 0;
                    type();
                }, 3000); // Wait 3s then loop
            }
        };

        type();
        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="bg-black/60 rounded-xl p-4 font-mono text-xs text-orange-400 border border-white/5 min-h-[140px]">
            <div className="flex justify-between mb-2 text-gray-500">
                <span>POST</span>
                <span className="text-green-500">200 OK</span>
            </div>
            <pre className="whitespace-pre-wrap">{displayedCode}<span className="animate-pulse">|</span></pre>
        </div>
    );
}
