'use client';

import { useState } from 'react';

interface DNACompareModalProps {
    isOpen: boolean;
    onClose: () => void;
    promptA?: string;
    promptB?: string;
    imageAUrl?: string;
    imageBUrl?: string;
}

const DNA_ELEMENTS = [
    { key: 'subject', icon: '👤', label: '主體' },
    { key: 'style', icon: '🎨', label: '風格' },
    { key: 'lighting', icon: '💡', label: '光線' },
    { key: 'color', icon: '🌈', label: '色彩' },
    { key: 'composition', icon: '📐', label: '構圖' },
    { key: 'mood', icon: '🎭', label: '氛圍' },
];

export default function DNACompareModal({ isOpen, onClose, promptA: initA, promptB: initB, imageAUrl, imageBUrl }: DNACompareModalProps) {
    const [promptA, setPromptA] = useState(initA || '');
    const [promptB, setPromptB] = useState(initB || '');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleCompare = async () => {
        if (!promptA.trim() && !imageAUrl) {
            alert('請至少輸入 Prompt A 或提供圖片 A');
            return;
        }

        setLoading(true);
        setResult(null);
        try {
            // Get image base64 if URLs provided
            let imageA = null;
            let imageB = null;

            if (imageAUrl) {
                const res = await fetch(imageAUrl);
                const blob = await res.blob();
                imageA = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            }

            if (imageBUrl) {
                const res = await fetch(imageBUrl);
                const blob = await res.blob();
                imageB = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            }

            const res = await fetch('/api/dna-compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    promptA: promptA || null,
                    promptB: promptB || null,
                    imageA,
                    imageB,
                    apiKey: localStorage.getItem('geminiApiKey') || ''
                })
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setResult(data);
        } catch (err: any) {
            alert('比較失敗：' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            🧬 Prompt DNA 比較
                            <span className="text-sm font-normal text-gray-400">分析兩個 Prompt 的核心差異</span>
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Input Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-blue-400 mb-2 block font-medium">🅰️ Prompt A</label>
                            <textarea
                                value={promptA}
                                onChange={(e) => setPromptA(e.target.value)}
                                className="w-full p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-white text-sm resize-none"
                                rows={4}
                                placeholder="輸入第一個 Prompt..."
                            />
                        </div>
                        <div>
                            <label className="text-sm text-pink-400 mb-2 block font-medium">🅱️ Prompt B</label>
                            <textarea
                                value={promptB}
                                onChange={(e) => setPromptB(e.target.value)}
                                className="w-full p-3 bg-pink-500/10 border border-pink-500/30 rounded-lg text-white text-sm resize-none"
                                rows={4}
                                placeholder="輸入第二個 Prompt（可選）..."
                            />
                        </div>
                    </div>

                    {/* Compare Button */}
                    <button
                        onClick={handleCompare}
                        disabled={loading || (!promptA.trim() && !imageAUrl)}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-500 hover:to-pink-500 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                    >
                        {loading ? '分析中...' : '🔬 分析 DNA 差異'}
                    </button>

                    {/* Results */}
                    {result && (
                        <div className="space-y-6">
                            {/* Similarity Score */}
                            {result.comparison && (
                                <div className="text-center p-4 bg-gradient-to-r from-blue-500/10 to-pink-500/10 rounded-xl border border-white/10">
                                    <div className="text-4xl font-bold text-white mb-1">
                                        {result.comparison.overallSimilarity}%
                                    </div>
                                    <div className="text-sm text-gray-400">整體相似度</div>
                                    <div className="mt-3 w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-pink-500 transition-all duration-500"
                                            style={{ width: `${result.comparison.overallSimilarity}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* DNA Elements Comparison */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* A DNA */}
                                {result.promptA_DNA && (
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                                        <h3 className="text-blue-400 font-medium mb-3">🅰️ Prompt A DNA</h3>
                                        <div className="space-y-2 text-xs">
                                            {DNA_ELEMENTS.map(el => (
                                                <div key={el.key} className="flex gap-2">
                                                    <span className="text-gray-500 w-16">{el.icon} {el.label}:</span>
                                                    <span className="text-gray-300">{result.promptA_DNA[el.key] || '-'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* B DNA */}
                                {result.promptB_DNA && (
                                    <div className="p-4 bg-pink-500/10 border border-pink-500/30 rounded-xl">
                                        <h3 className="text-pink-400 font-medium mb-3">🅱️ Prompt B DNA</h3>
                                        <div className="space-y-2 text-xs">
                                            {DNA_ELEMENTS.map(el => (
                                                <div key={el.key} className="flex gap-2">
                                                    <span className="text-gray-500 w-16">{el.icon} {el.label}:</span>
                                                    <span className="text-gray-300">{result.promptB_DNA[el.key] || '-'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Key Differences */}
                            {result.comparison?.differences && result.comparison.differences.length > 0 && (
                                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                                    <h3 className="text-amber-400 font-medium mb-3">🔀 主要差異</h3>
                                    <div className="space-y-3">
                                        {result.comparison.differences.map((diff: any, i: number) => (
                                            <div key={i} className="p-2 bg-black/20 rounded-lg text-xs">
                                                <div className="flex gap-2 mb-1">
                                                    <span className="text-gray-500 font-medium">{diff.element}:</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                    <div className="text-blue-300">A: {diff.a}</div>
                                                    <div className="text-pink-300">B: {diff.b}</div>
                                                </div>
                                                {diff.impact && (
                                                    <div className="text-gray-500 mt-1 italic">影響：{diff.impact}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Insights */}
                            {result.insights && (
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                                    <h3 className="text-emerald-400 font-medium mb-3">💡 學習要點</h3>
                                    <div className="space-y-2 text-xs text-gray-300">
                                        {result.insights.whyAWorks && (
                                            <p><span className="text-blue-400">A 的優勢：</span>{result.insights.whyAWorks}</p>
                                        )}
                                        {result.insights.whyBWorks && (
                                            <p><span className="text-pink-400">B 的優勢：</span>{result.insights.whyBWorks}</p>
                                        )}
                                        {result.insights.combinationTip && (
                                            <p className="text-emerald-300 mt-2">🎯 結合建議：{result.insights.combinationTip}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Fusion Prompt */}
                            {result.fusionPrompt && (
                                <div className="p-4 bg-gradient-to-r from-blue-500/10 to-pink-500/10 border border-white/20 rounded-xl">
                                    <h3 className="text-white font-medium mb-2">✨ 融合 Prompt</h3>
                                    <p className="text-gray-300 text-sm">{result.fusionPrompt}</p>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(result.fusionPrompt);
                                            alert('已複製融合 Prompt！');
                                        }}
                                        className="mt-3 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white transition-colors"
                                    >
                                        📋 複製融合 Prompt
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
