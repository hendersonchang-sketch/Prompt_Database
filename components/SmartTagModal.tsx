'use client';

import { useState, useRef } from 'react';

interface SmartTagModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialImageUrl?: string;
    onApplyTags?: (tags: string[]) => void;
}

const TAG_CATEGORIES = [
    { key: 'style', icon: '🎨', label: '風格', color: 'purple' },
    { key: 'subject', icon: '👤', label: '主體', color: 'blue' },
    { key: 'mood', icon: '🎭', label: '氛圍', color: 'pink' },
    { key: 'color', icon: '🌈', label: '色彩', color: 'orange' },
    { key: 'technical', icon: '📷', label: '技術', color: 'cyan' },
    { key: 'quality', icon: '✨', label: '品質', color: 'yellow' },
    { key: 'theme', icon: '📚', label: '主題', color: 'green' },
];

const CATEGORY_ICONS: Record<string, string> = {
    portrait: '👤',
    landscape: '🏞️',
    character: '🦸',
    object: '📦',
    abstract: '🎨',
    scene: '🎬',
    architecture: '🏛️',
    vehicle: '🚗',
    food: '🍔',
    animal: '🐾',
    fashion: '👗',
    fantasy: '🧙',
    scifi: '🚀',
};

export default function SmartTagModal({ isOpen, onClose, initialImageUrl, onApplyTags }: SmartTagModalProps) {
    const [imagePreview, setImagePreview] = useState<string | null>(initialImageUrl || null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                setResult(null);
                setSelectedTags(new Set());
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async () => {
        if (!imagePreview) return;

        setLoading(true);
        setResult(null);
        try {
            const res = await fetch('/api/auto-tag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageBase64: imagePreview,
                    apiKey: localStorage.getItem('geminiApiKey') || ''
                })
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setResult(data);

            // Auto-select flat tags
            if (data.flatTags) {
                setSelectedTags(new Set(data.flatTags));
            }
        } catch (err: any) {
            alert('標籤分析失敗：' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev => {
            const next = new Set(prev);
            if (next.has(tag)) {
                next.delete(tag);
            } else {
                next.add(tag);
            }
            return next;
        });
    };

    const selectAllInCategory = (category: string) => {
        if (result?.hierarchicalTags?.[category]) {
            setSelectedTags(prev => {
                const next = new Set(prev);
                result.hierarchicalTags[category].forEach((tag: string) => next.add(tag));
                return next;
            });
        }
    };

    const copySelectedTags = () => {
        const tags = Array.from(selectedTags).join(', ');
        navigator.clipboard.writeText(tags);
        alert('已複製 ' + selectedTags.size + ' 個標籤！');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-[#1A1206]/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#1A1206] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-amber-700/40 shadow-[0_8px_60px_rgba(139,69,19,0.4)]">
                {/* Header */}
                <div className="p-6 border-b border-amber-700/40 sticky top-0 bg-[#1A1206]/90 backdrop-blur-sm z-10">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            🏷️ 智能標籤系統
                            <span className="text-sm font-normal text-gray-400">AI 自動分類與標籤</span>
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
                    {/* Upload & Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Image */}
                        <div className="space-y-3">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative aspect-square rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden ${imagePreview
                                    ? 'border-emerald-500/50'
                                    : 'border-white/20 hover:border-emerald-500/50'
                                    }`}
                            >
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-contain bg-black/30" />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                                        <span className="text-5xl mb-3">🖼️</span>
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

                            <button
                                onClick={handleAnalyze}
                                disabled={loading || !imagePreview}
                                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                            >
                                {loading ? '🔍 分析中...' : '🏷️ 分析標籤'}
                            </button>

                            {/* Primary Category */}
                            {result && (
                                <div className="p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl text-center">
                                    <div className="text-4xl mb-2">
                                        {CATEGORY_ICONS[result.primaryCategory] || '📁'}
                                    </div>
                                    <div className="text-emerald-300 font-bold text-lg capitalize">
                                        {result.primaryCategory}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        信心度：{Math.round((result.confidence || 0) * 100)}%
                                    </div>
                                    {result.descriptionZH && (
                                        <p className="text-gray-400 text-xs mt-2 italic">
                                            {result.descriptionZH}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Tags */}
                        <div className="md:col-span-2 space-y-4">
                            {result ? (
                                <>
                                    {/* Category Tabs */}
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setActiveCategory(null)}
                                            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${activeCategory === null
                                                ? 'bg-white/20 text-white'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                }`}
                                        >
                                            全部
                                        </button>
                                        {TAG_CATEGORIES.map(cat => (
                                            <button
                                                key={cat.key}
                                                onClick={() => setActiveCategory(cat.key)}
                                                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${activeCategory === cat.key
                                                    ? `bg-${cat.color}-500/30 text-${cat.color}-300 border border-${cat.color}-500`
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                    }`}
                                            >
                                                {cat.icon} {cat.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Tag Cloud */}
                                    <div className="p-4 bg-black/30 rounded-xl max-h-64 overflow-y-auto">
                                        {TAG_CATEGORIES.filter(cat => !activeCategory || activeCategory === cat.key).map(cat => {
                                            const tags = result.hierarchicalTags?.[cat.key] || [];
                                            if (tags.length === 0) return null;

                                            return (
                                                <div key={cat.key} className="mb-4 last:mb-0">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs text-gray-500 font-medium">
                                                            {cat.icon} {cat.label}
                                                        </span>
                                                        <button
                                                            onClick={() => selectAllInCategory(cat.key)}
                                                            className="text-[10px] text-gray-600 hover:text-white"
                                                        >
                                                            全選
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {tags.map((tag: string, idx: number) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => toggleTag(tag)}
                                                                className={`px-2 py-1 rounded text-xs transition-all ${selectedTags.has(tag)
                                                                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500'
                                                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                                                    }`}
                                                            >
                                                                {tag}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Selected Tags Summary */}
                                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs text-emerald-300 font-medium">
                                                ✓ 已選擇 {selectedTags.size} 個標籤
                                            </span>
                                            <button
                                                onClick={() => setSelectedTags(new Set())}
                                                className="text-[10px] text-gray-500 hover:text-red-400"
                                            >
                                                清除全部
                                            </button>
                                        </div>
                                        <div className="text-xs text-gray-400 line-clamp-2">
                                            {Array.from(selectedTags).join(', ') || '（尚未選擇標籤）'}
                                        </div>
                                    </div>

                                    {/* Suggested Collections */}
                                    {result.suggestedCollections && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">📁 建議收藏集：</span>
                                            {result.suggestedCollections.map((col: string, i: number) => (
                                                <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                                                    {col}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={copySelectedTags}
                                            disabled={selectedTags.size === 0}
                                            className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg text-sm transition-all disabled:opacity-50"
                                        >
                                            📋 複製標籤
                                        </button>
                                        {onApplyTags && (
                                            <button
                                                onClick={() => {
                                                    onApplyTags(Array.from(selectedTags));
                                                    onClose();
                                                }}
                                                disabled={selectedTags.size === 0}
                                                className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-sm transition-all disabled:opacity-50"
                                            >
                                                💾 套用到圖片
                                            </button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 py-12">
                                    <span className="text-6xl mb-4">🏷️</span>
                                    <p className="text-sm text-center">
                                        上傳圖片後<br />
                                        AI 將自動生成多層級標籤
                                    </p>
                                    <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-xs">
                                        {TAG_CATEGORIES.map(cat => (
                                            <span key={cat.key} className="px-2 py-1 bg-white/5 rounded text-xs text-gray-600">
                                                {cat.icon} {cat.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
