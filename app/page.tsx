"use client";

import { useState, useEffect } from "react";
import PromptForm from "@/components/PromptForm";
import PromptGallery from "@/components/PromptGallery";
import ServerStatus from "@/components/ServerStatus";
import PromptLabModal from "@/components/PromptLabModal";
import InspirationMap from "@/components/InspirationMap";
import StoryboardModal from "@/components/StoryboardModal";
import MagicCanvas from "@/components/MagicCanvas";
import StyleTunerModal from "@/components/StyleTunerModal";
import BatchImportModal from "@/components/BatchImportModal";
import AutoRefinerModal from "@/components/AutoRefinerModal";

export default function Home() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [reuseData, setReuseData] = useState<any>(null);
    const [showChangelog, setShowChangelog] = useState(false);
    const [changelog, setChangelog] = useState<string>("");
    const [showPromptLab, setShowPromptLab] = useState(false);
    const [showInspirationMap, setShowInspirationMap] = useState(false);
    const [showStoryboard, setShowStoryboard] = useState(false);
    const [showMagicCanvas, setShowMagicCanvas] = useState(false);
    const [showStyleTuner, setShowStyleTuner] = useState(false);
    const [showBatchImport, setShowBatchImport] = useState(false);
    const [showAutoRefiner, setShowAutoRefiner] = useState(false);

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

    const handleUsePrompt = (prompt: string) => {
        setReuseData({
            prompt: prompt,
            // Keep defaults
            width: 1024,
            height: 1024,
            steps: 25,
            cfgScale: 7.0,
            seed: -1
        });
        setShowPromptLab(false);
        setShowInspirationMap(false);
        setShowStoryboard(false);
        setShowMagicCanvas(false);
        setShowStyleTuner(false);
        setShowBatchImport(false);
        setShowAutoRefiner(false);
    };


    return (
        <main className="min-h-screen flex flex-col items-center py-8 md:py-20 gap-8 md:gap-16 px-4">
            <div className="text-center space-y-2 md:space-y-4">
                <h1 className="text-3xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-600">
                    Prompt Database
                </h1>
                <p className="text-gray-400 text-sm md:text-lg">打造您的專屬提示詞庫</p>

                <div className="flex justify-center gap-4 text-xs font-semibold">
                    {/* Changelog Button */}
                    <button
                        onClick={() => setShowChangelog(true)}
                        className="text-gray-500 hover:text-cyan-400 transition-colors underline underline-offset-2"
                    >
                        📋 查看更新日誌
                    </button>
                    {/* Prompt Lab Button */}
                    <button
                        onClick={() => setShowPromptLab(true)}
                        className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                    >
                        🧪 Prompt 實驗室
                    </button>
                    {/* Inspiration Map Button */}
                    <button
                        onClick={() => setShowInspirationMap(true)}
                        className="text-pink-400 hover:text-pink-300 transition-colors flex items-center gap-1"
                    >
                        🕸️ 靈感地圖
                    </button>
                    {/* Storyboard Button */}
                    <button
                        onClick={() => setShowStoryboard(true)}
                        className="text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1"
                    >
                        🎬 故事板
                    </button>
                    {/* Magic Canvas Button */}
                    <button
                        onClick={() => setShowMagicCanvas(true)}
                        className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                    >
                        🖌️ Magic Canvas
                    </button>
                    {/* Style Tuner Button */}
                    <button
                        onClick={() => setShowStyleTuner(true)}
                        className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                    >
                        ⚖️ 風格調校
                    </button>
                    {/* Batch Import Button */}
                    <button
                        onClick={() => setShowBatchImport(true)}
                        className="text-green-400 hover:text-green-300 transition-colors flex items-center gap-1"
                    >
                        📥 批量匯入
                    </button>
                    {/* Auto Refiner Button */}
                    <button
                        onClick={() => setShowAutoRefiner(true)}
                        className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                    >
                        🤖 Auto Agent
                    </button>
                </div>
            </div>

            <PromptLabModal
                isOpen={showPromptLab}
                onClose={() => setShowPromptLab(false)}
                onUsePrompt={handleUsePrompt}
            />

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

            {/* Inspiration Map Modal */}
            {showInspirationMap && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setShowInspirationMap(false)}
                >
                    <div
                        className="bg-gray-900 border border-white/20 rounded-2xl w-full max-w-5xl h-[80vh] flex flex-col relative"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-4 border-b border-white/10 shrink-0">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                🕸️ 靈感地圖
                                <span className="text-xs font-normal text-gray-400 bg-white/10 px-2 py-0.5 rounded">Beta</span>
                            </h2>
                            <button
                                onClick={() => setShowInspirationMap(false)}
                                className="text-gray-500 hover:text-white text-2xl"
                            >×</button>
                        </div>
                        <div className="flex-1 overflow-hidden relative p-4">
                            <InspirationMap onSelect={handleUsePrompt} />
                        </div>
                        <div className="p-4 border-t border-white/10 text-center text-xs text-gray-500">
                            點擊節點可直接將 Prompt 帶入輸入框
                        </div>
                    </div>
                </div>
            )}

            {/* AI Storyboard Modal */}
            <StoryboardModal isOpen={showStoryboard} onClose={() => setShowStoryboard(false)} />

            {/* Magic Canvas Modal */}
            <MagicCanvas isOpen={showMagicCanvas} onClose={() => setShowMagicCanvas(false)} />

            {/* Style Tuner Modal */}
            <StyleTunerModal isOpen={showStyleTuner} onClose={() => setShowStyleTuner(false)} />

            {/* Batch Import Modal */}
            <BatchImportModal isOpen={showBatchImport} onClose={() => setShowBatchImport(false)} />

            {/* Auto Refiner Modal */}
            <AutoRefinerModal isOpen={showAutoRefiner} onClose={() => setShowAutoRefiner(false)} />
        </main>
    );
}
