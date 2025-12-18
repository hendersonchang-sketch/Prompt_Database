'use client';

import { useState } from 'react';

interface MoodSliderModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialPrompt: string;
    onApply: (newPrompt: string) => void;
}

const MOOD_DIMENSIONS = [
    { key: 'happiness', label: '😊 情緒', leftLabel: '憂鬱', rightLabel: '歡樂', color: 'yellow' },
    { key: 'energy', label: '⚡ 能量', leftLabel: '平靜', rightLabel: '動感', color: 'orange' },
    { key: 'warmth', label: '🎨 色溫', leftLabel: '冷色調', rightLabel: '暖色調', color: 'red' },
    { key: 'mystery', label: '🌫️ 神秘', leftLabel: '清晰', rightLabel: '神秘', color: 'purple' },
    { key: 'drama', label: '🎭 戲劇', leftLabel: '平淡', rightLabel: '戲劇性', color: 'pink' },
];

export default function MoodSliderModal({ isOpen, onClose, initialPrompt, onApply }: MoodSliderModalProps) {
    const [prompt, setPrompt] = useState(initialPrompt);
    const [mood, setMood] = useState({
        happiness: 0,
        energy: 0,
        warmth: 0,
        mystery: 0,
        drama: 0,
    });
    const [intensity, setIntensity] = useState(50);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await fetch('/api/mood-slider', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    mood,
                    intensity,
                    apiKey: localStorage.getItem('geminiApiKey') || ''
                })
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setResult(data);
        } catch (err: any) {
            alert('情緒調整失敗：' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetMood = () => {
        setMood({ happiness: 0, energy: 0, warmth: 0, mystery: 0, drama: 0 });
        setIntensity(50);
        setResult(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            🎨 情緒滑桿
                            <span className="text-sm font-normal text-gray-400">調整 Prompt 的情緒氛圍</span>
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
                    {/* Original Prompt */}
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">原始 Prompt</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-white text-sm resize-none"
                            rows={3}
                            placeholder="輸入要調整情緒的 Prompt..."
                        />
                    </div>

                    {/* Mood Sliders */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">情緒維度</span>
                            <button
                                onClick={resetMood}
                                className="text-xs text-gray-500 hover:text-white transition-colors"
                            >
                                重置所有
                            </button>
                        </div>

                        {MOOD_DIMENSIONS.map(dim => (
                            <div key={dim.key} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">{dim.leftLabel}</span>
                                    <span className={`text-${dim.color}-400 font-medium`}>{dim.label}</span>
                                    <span className="text-gray-500">{dim.rightLabel}</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="range"
                                        min="-100"
                                        max="100"
                                        value={mood[dim.key as keyof typeof mood]}
                                        onChange={(e) => setMood(prev => ({ ...prev, [dim.key]: Number(e.target.value) }))}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
                                    />
                                    <div className="absolute top-1/2 left-1/2 w-0.5 h-4 bg-gray-500 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                                <div className="text-center text-xs text-gray-500">
                                    {mood[dim.key as keyof typeof mood]}
                                </div>
                            </div>
                        ))}

                        {/* Intensity */}
                        <div className="pt-4 border-t border-white/10">
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-gray-500">輕微</span>
                                <span className="text-blue-400 font-medium">🎚️ 調整強度</span>
                                <span className="text-gray-500">強烈</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={intensity}
                                onChange={(e) => setIntensity(Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="text-center text-xs text-gray-500 mt-1">{intensity}%</div>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim()}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                    >
                        {loading ? '調整中...' : '✨ 生成情緒版本'}
                    </button>

                    {/* Result */}
                    {result && (
                        <div className="space-y-4">
                            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                                <p className="text-sm text-purple-300 font-medium mb-2">🎭 調整後 Prompt</p>
                                <p className="text-white text-sm leading-relaxed">{result.modified}</p>
                                {result.modifiedZH && (
                                    <p className="text-gray-400 text-xs mt-2">{result.modifiedZH}</p>
                                )}
                            </div>

                            {result.moodKeywords && result.moodKeywords.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {result.moodKeywords.map((kw: string, i: number) => (
                                        <span key={i} className="px-2 py-1 bg-white/10 rounded text-xs text-gray-300">{kw}</span>
                                    ))}
                                </div>
                            )}

                            {result.atmosphereNote && (
                                <p className="text-xs text-gray-500 italic">💡 {result.atmosphereNote}</p>
                            )}

                            <button
                                onClick={() => onApply(result.modified)}
                                className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg text-sm transition-all"
                            >
                                📋 套用到 Prompt
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
