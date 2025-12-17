"use client";
import { useState } from "react";

interface StyleFusionDialogProps {
    imageA: {
        id: string;
        imageUrl: string;
        prompt: string;
        promptZh?: string | null;
    };
    imageB: {
        id: string;
        imageUrl: string;
        prompt: string;
        promptZh?: string | null;
    };
    onConfirm: (mode: "themeA" | "themeB" | "auto", ratio: number) => void;
    onClose: () => void;
}

export default function StyleFusionDialog({ imageA, imageB, onConfirm, onClose }: StyleFusionDialogProps) {
    const [selectedMode, setSelectedMode] = useState<"themeA" | "themeB" | "auto">("themeA");
    const [ratio, setRatio] = useState(70); // Default: 70% main theme, 30% style source

    const modes = [
        {
            id: "themeA" as const,
            label: "主題取自 A",
            description: "A 的主體 + B 的風格",
            icon: "🎯",
        },
        {
            id: "themeB" as const,
            label: "主題取自 B",
            description: "B 的主體 + A 的風格",
            icon: "🎯",
        },
        {
            id: "auto" as const,
            label: "AI 自動融合",
            description: "讓 AI 自由組合兩者",
            icon: "✨",
        },
    ];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto">
            <div
                className="bg-gray-900/95 border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto my-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        🎨 風格融合設定
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Image Preview */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Image A */}
                    <div className="space-y-2">
                        <div className="relative">
                            <img
                                src={imageA.imageUrl}
                                alt="Image A"
                                className="w-full aspect-square object-cover rounded-xl border-2 border-blue-500/50"
                            />
                            <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                                A
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-xs text-gray-300 line-clamp-3 flex-1">
                                    {imageA.promptZh || imageA.prompt}
                                </p>
                                <button
                                    onClick={async () => {
                                        await navigator.clipboard.writeText(imageA.prompt);
                                        alert("已複製 A 的 Prompt！");
                                    }}
                                    className="shrink-0 p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                                    title="複製 Prompt A"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Image B */}
                    <div className="space-y-2">
                        <div className="relative">
                            <img
                                src={imageB.imageUrl}
                                alt="Image B"
                                className="w-full aspect-square object-cover rounded-xl border-2 border-green-500/50"
                            />
                            <div className="absolute top-2 left-2 px-2 py-1 bg-green-600 text-white text-xs font-bold rounded">
                                B
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-xs text-gray-300 line-clamp-3 flex-1">
                                    {imageB.promptZh || imageB.prompt}
                                </p>
                                <button
                                    onClick={async () => {
                                        await navigator.clipboard.writeText(imageB.prompt);
                                        alert("已複製 B 的 Prompt！");
                                    }}
                                    className="shrink-0 p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                                    title="複製 Prompt B"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mode Selection */}
                <div className="space-y-3 mb-6">
                    <label className="text-sm text-gray-400">選擇融合模式</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {modes.map((mode) => (
                            <button
                                key={mode.id}
                                onClick={() => setSelectedMode(mode.id)}
                                className={`p-4 rounded-xl border text-left transition-all ${selectedMode === mode.id
                                    ? "border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/10"
                                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                                    }`}
                            >
                                <div className="text-2xl mb-2">{mode.icon}</div>
                                <div className="text-sm font-medium text-white">{mode.label}</div>
                                <div className="text-xs text-gray-400 mt-1">{mode.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Ratio Slider (only for themeA/themeB modes) */}
                {selectedMode !== "auto" && (
                    <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-sm text-gray-400">主題/風格比例</label>
                            <span className="text-sm font-mono text-purple-300">
                                {ratio}% 主題 / {100 - ratio}% 風格
                            </span>
                        </div>
                        <input
                            type="range"
                            min="30"
                            max="90"
                            step="10"
                            value={ratio}
                            onChange={(e) => setRatio(Number(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>更多風格</span>
                            <span>更多主題</span>
                        </div>
                    </div>
                )}

                {/* Preview Text */}
                <div className="p-4 bg-gradient-to-r from-pink-500/10 to-orange-500/10 rounded-xl border border-pink-500/20 mb-6">
                    <div className="text-xs text-gray-400 mb-1">預覽指令</div>
                    <p className="text-sm text-gray-200">
                        {selectedMode === "themeA" && (
                            <>保留 <span className="text-blue-400 font-medium">A</span> 的主題，融入 <span className="text-green-400 font-medium">B</span> 的風格 ({ratio}:{100 - ratio})</>
                        )}
                        {selectedMode === "themeB" && (
                            <>保留 <span className="text-green-400 font-medium">B</span> 的主題，融入 <span className="text-blue-400 font-medium">A</span> 的風格 ({ratio}:{100 - ratio})</>
                        )}
                        {selectedMode === "auto" && (
                            <>AI 將自動分析兩者的特點並創造性地融合</>
                        )}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={() => onConfirm(selectedMode, ratio)}
                        className="px-6 py-2 bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-500 hover:to-orange-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        🎨 開始融合
                    </button>
                </div>
            </div>
        </div>
    );
}
