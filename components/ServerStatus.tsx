"use client";
import { useState, useEffect } from "react";

export default function ServerStatus() {
    const [isOnline, setIsOnline] = useState<boolean | null>(null);
    const [lastCheck, setLastCheck] = useState<Date | null>(null);

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const res = await fetch('/api/health', {
                    method: 'GET',
                    cache: 'no-store'
                });
                setIsOnline(res.ok);
            } catch {
                setIsOnline(false);
            }
            setLastCheck(new Date());
        };

        // Check immediately
        checkHealth();

        // Check every 10 seconds
        const interval = setInterval(checkHealth, 10000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div
            className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 shadow-lg z-50 cursor-default"
            title={lastCheck ? `最後檢查: ${lastCheck.toLocaleTimeString()}` : '檢查中...'}
        >
            {/* Status Light */}
            <div className="relative">
                <div
                    className={`w-3 h-3 rounded-full transition-colors ${isOnline === null
                            ? 'bg-yellow-500'
                            : isOnline
                                ? 'bg-green-500'
                                : 'bg-red-500'
                        }`}
                />
                {/* Pulse animation when online */}
                {isOnline && (
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75" />
                )}
            </div>

            {/* Status Text */}
            <span className="text-xs text-gray-300">
                {isOnline === null
                    ? '檢查中...'
                    : isOnline
                        ? '後台運行中'
                        : '後台未啟動'}
            </span>
        </div>
    );
}
