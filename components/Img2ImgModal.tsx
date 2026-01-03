'use client';

import { useState, useRef } from 'react';

interface Img2ImgModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialImageUrl?: string;
    onSaveToGallery?: (imageUrl: string) => void;
}

const STYLE_MODES = [
    { id: 'preserve', label: '🔒 保留風格', desc: '維持原圖風格與色調' },
    { id: 'enhance', label: '✨ 增強品質', desc: '保留主體，提升細節' },
    { id: 'transform', label: '🎨 風格轉換', desc: '創意詮釋，自由變化' },
];

const QUICK_PROMPTS = [
    { label: '變成夜晚', prompt: 'Transform to night scene with moonlight and stars' },
    { label: '加入雪景', prompt: 'Add snow and winter atmosphere' },
    { label: '動漫風格', prompt: 'Convert to anime style illustration' },
    { label: '水彩畫', prompt: 'Transform to watercolor painting style' },
    { label: '賽博龐克', prompt: 'Apply cyberpunk neon aesthetic' },
    { label: '復古風格', prompt: 'Apply vintage retro photo filter' },
    { label: '油畫風格', prompt: 'Convert to oil painting style' },
    { label: '素描風格', prompt: 'Transform to pencil sketch drawing' },
];

export default function Img2ImgModal({ isOpen, onClose, initialImageUrl, onSaveToGallery }: Img2ImgModalProps) {
    const [sourceImage, setSourceImage] = useState<string | null>(initialImageUrl || null);
    const [prompt, setPrompt] = useState('');
    const [strength, setStrength] = useState(50);
    const [style, setStyle] = useState('preserve');
    const [loading, setLoading] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSourceImage(reader.result as string);
                setResultImage(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!sourceImage || !prompt.trim()) return;

        setLoading(true);
        setError(null);
        setResultImage(null);

        try {
            const res = await fetch('/api/img2img', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageBase64: sourceImage,
                    prompt,
                    strength,
                    style,
                    apiKey: localStorage.getItem('geminiApiKey') || ''
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Generation failed');
            }

            if (data.imageUrl) {
                setResultImage(data.imageUrl);
            } else {
                throw new Error(data.textResponse || 'No image returned');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickPrompt = (p: string) => {
        setPrompt(p);
    };

    const handleDownload = async () => {
        if (!resultImage) return;

        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `img2img-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-[#1A1206]/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#1A1206] rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border-2 border-amber-700/40 shadow-[0_8px_60px_rgba(139,69,19,0.4)]">
                {/* Header */}
                <div className="p-6 border-b border-amber-700/40 sticky top-0 bg-[#1A1206]/90 backdrop-blur-sm z-10">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            🖼️ 圖生圖
                            <span className="text-sm font-normal text-gray-400">以圖片為基礎生成新圖</span>
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
                    {/* Image Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Source Image */}
                        <div className="space-y-2">
                            <p className="text-sm text-gray-400 font-medium">📷 原始圖片</p>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative aspect-square rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden ${sourceImage
                                    ? 'border-blue-500/50'
                                    : 'border-white/20 hover:border-blue-500/50'
                                    }`}
                            >
                                {sourceImage ? (
                                    <img src={sourceImage} alt="Source" className="w-full h-full object-contain bg-black/30" />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                                        <span className="text-5xl mb-3">📷</span>
                                        <span className="text-sm">點擊上傳圖片</span>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        {/* Result Image */}
                        <div className="space-y-2">
                            <p className="text-sm text-gray-400 font-medium">✨ 生成結果</p>
                            <div className="relative aspect-square rounded-xl border-2 border-dashed border-white/20 overflow-hidden bg-black/30">
                                {loading ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
                                        <p className="text-gray-400 text-sm">生成中...</p>
                                    </div>
                                ) : resultImage ? (
                                    <img src={resultImage} alt="Result" className="w-full h-full object-contain" />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                                        <span className="text-5xl mb-3">🎨</span>
                                        <span className="text-sm">生成結果將顯示在這裡</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Prompt Input */}
                    <div className="space-y-3">
                        <label className="text-sm text-gray-400 font-medium">💬 修改指令</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="描述你想要的修改，例如：改成夜晚、加入雪景、轉換成動漫風格..."
                            className="w-full p-4 bg-black/30 border border-white/10 rounded-xl text-white text-sm resize-none"
                            rows={3}
                        />

                        {/* Quick Prompts */}
                        <div className="flex flex-wrap gap-2">
                            {QUICK_PROMPTS.map((qp, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleQuickPrompt(qp.prompt)}
                                    className="px-3 py-1.5 bg-white/10 hover:bg-purple-500/30 text-gray-300 hover:text-white rounded-lg text-xs transition-all"
                                >
                                    {qp.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Strength Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">保留原圖</span>
                                <span className="text-amber-400 font-medium">🎚️ 變化強度: {strength}%</span>
                                <span className="text-gray-500">大幅改變</span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="90"
                                value={strength}
                                onChange={(e) => setStrength(Number(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                        </div>

                        {/* Style Mode */}
                        <div className="space-y-2">
                            <p className="text-xs text-amber-400 font-medium">🎨 轉換模式</p>
                            <div className="flex gap-2">
                                {STYLE_MODES.map((mode) => (
                                    <button
                                        key={mode.id}
                                        onClick={() => setStyle(mode.id)}
                                        className={`flex-1 p-2 rounded-lg text-xs transition-all ${style === mode.id
                                            ? 'bg-amber-500/30 border border-amber-500 text-white'
                                            : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="font-medium">{mode.label}</div>
                                        <div className="text-[10px] opacity-70 mt-0.5">{mode.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            ❌ {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !sourceImage || !prompt.trim()}
                            className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                        >
                            {loading ? '🔄 生成中...' : '✨ 生成新圖'}
                        </button>

                        {resultImage && (
                            <>
                                <button
                                    onClick={handleDownload}
                                    className="px-6 py-3 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-xl font-medium transition-all"
                                >
                                    📥 下載
                                </button>
                                {onSaveToGallery && (
                                    <button
                                        onClick={() => {
                                            onSaveToGallery(resultImage);
                                            onClose();
                                        }}
                                        className="px-6 py-3 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl font-medium transition-all"
                                    >
                                        💾 存入圖庫
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    {/* Tips */}
                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                        <p className="text-xs text-purple-300 font-medium mb-2">💡 使用技巧</p>
                        <ul className="text-xs text-gray-400 space-y-1">
                            <li>• <strong>低強度 (10-30%)</strong>：微調顏色、光線，保留原圖結構</li>
                            <li>• <strong>中強度 (40-60%)</strong>：風格轉換、場景變化</li>
                            <li>• <strong>高強度 (70-90%)</strong>：大幅度創意改變</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
