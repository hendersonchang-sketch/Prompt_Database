"use client";

import { useState, useEffect } from "react";
import PromptForm from "@/components/PromptForm";
import PromptGallery from "@/components/PromptGallery";
import ServerStatus from "@/components/ServerStatus";

export default function Home() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [reuseData, setReuseData] = useState<any>(null);
    const [showChangelog, setShowChangelog] = useState(false);
    const [changelog, setChangelog] = useState<string>("");

    // Load changelog
    useEffect(() => {
        if (showChangelog && !changelog) {
            fetch('/CHANGELOG.md')
                .then(res => res.text())
                .then(text => setChangelog(text))
                .catch(() => setChangelog('無法載入更新日誌'));
        }
    }, [showChangelog, changelog]);

    const handleSuccess = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    return (
        <main className="min-h-screen flex flex-col items-center py-8 md:py-20 gap-8 md:gap-16 px-4">
            <div className="text-center space-y-2 md:space-y-4">
                <h1 className="text-3xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-600">
                    Prompt Database
                </h1>
                <p className="text-gray-400 text-sm md:text-lg">打造您的專屬提示詞庫</p>
                {/* Changelog Button */}
                <button
                    onClick={() => setShowChangelog(true)}
                    className="text-xs text-gray-500 hover:text-cyan-400 transition-colors underline underline-offset-2"
                >
                    📋 查看更新日誌
                </button>
            </div>

            <PromptForm onSuccess={handleSuccess} initialData={reuseData} />

            <div className="w-full border-t border-white/10" />

            <PromptGallery refreshTrigger={refreshTrigger} onReuse={setReuseData} />

            {/* Server Status Indicator */}
            <ServerStatus />

            {/* Changelog Modal */}
            {showChangelog && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowChangelog(false)}
                >
                    <div
                        className="bg-gray-900 border border-white/20 rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-4 border-b border-white/10">
                            <h2 className="text-lg font-bold text-white">📋 程式修改日誌</h2>
                            <button
                                onClick={() => setShowChangelog(false)}
                                className="text-gray-500 hover:text-white text-2xl"
                            >×</button>
                        </div>
                        <div className="overflow-y-auto p-4 prose prose-invert prose-sm max-w-none">
                            <pre className="whitespace-pre-wrap text-xs text-gray-300 font-mono leading-relaxed">
                                {changelog || '載入中...'}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
