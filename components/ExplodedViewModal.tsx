'use client';

import { useState, useRef } from 'react';

interface ExplodedViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUsePrompt?: (prompt: string) => void;
}

export default function ExplodedViewModal({ isOpen, onClose, onUsePrompt }: ExplodedViewModalProps) {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [productName, setProductName] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [selectedComponent, setSelectedComponent] = useState<number | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                setResult(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async () => {
        if (!imagePreview) return;

        setLoading(true);
        setResult(null);
        try {
            const res = await fetch('/api/exploded-view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageBase64: imagePreview,
                    productName: productName || undefined,
                    apiKey: localStorage.getItem('geminiApiKey') || ''
                })
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setResult(data);
        } catch (err: any) {
            alert('分析失敗：' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyPrompt = (prompt: string) => {
        navigator.clipboard.writeText(prompt);
        alert('已複製 Prompt！');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
                {/* Header */}
                <div className="p-6 border-b border-white/10 sticky top-0 bg-gray-900/90 backdrop-blur-sm z-10">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            📦 零件拆解圖
                            <span className="text-sm font-normal text-gray-400">產品分解 • 爆炸視圖生成</span>
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
                    {/* Upload Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left: Image Upload */}
                        <div className="space-y-4">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative aspect-square rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden ${imagePreview
                                        ? 'border-amber-500/50'
                                        : 'border-white/20 hover:border-amber-500/50'
                                    }`}
                            >
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} alt="Product" className="w-full h-full object-contain" />

                                        {/* Component Bounding Boxes */}
                                        {result?.components && (
                                            <div className="absolute inset-0">
                                                {result.components.map((comp: any, idx: number) => {
                                                    const [ymin, xmin, ymax, xmax] = comp.boundingBox || [0, 0, 0, 0];
                                                    return (
                                                        <div
                                                            key={idx}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedComponent(selectedComponent === idx ? null : idx);
                                                            }}
                                                            className={`absolute border-2 cursor-pointer transition-all ${selectedComponent === idx
                                                                    ? 'border-amber-400 bg-amber-400/20'
                                                                    : 'border-white/40 hover:border-amber-400 hover:bg-amber-400/10'
                                                                }`}
                                                            style={{
                                                                top: `${ymin / 10}%`,
                                                                left: `${xmin / 10}%`,
                                                                height: `${(ymax - ymin) / 10}%`,
                                                                width: `${(xmax - xmin) / 10}%`,
                                                            }}
                                                        >
                                                            <span className="absolute -top-5 left-0 bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded">
                                                                {comp.id}. {comp.nameZH || comp.name}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                                        <span className="text-5xl mb-3">📦</span>
                                        <span className="text-sm">點擊上傳產品圖片</span>
                                        <span className="text-xs text-gray-600 mt-1">支援 JPG、PNG</span>
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

                            {/* Product Name Input */}
                            <input
                                type="text"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                placeholder="產品名稱（選填，例如：無線耳機、機械鍵盤）"
                                className="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-white text-sm"
                            />

                            {/* Analyze Button */}
                            <button
                                onClick={handleAnalyze}
                                disabled={loading || !imagePreview}
                                className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                            >
                                {loading ? '🔍 分析中...' : '🔬 分析零件結構'}
                            </button>
                        </div>

                        {/* Right: Results */}
                        <div className="space-y-4">
                            {result ? (
                                <>
                                    {/* Product Info */}
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-amber-300 font-medium">{result.productName}</h3>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    類別：{result.productCategory} • 共 {result.totalParts} 個零件
                                                </p>
                                            </div>
                                            <span className="text-2xl">📦</span>
                                        </div>
                                    </div>

                                    {/* Components List */}
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        <p className="text-xs text-gray-400 font-medium">🔩 零件清單</p>
                                        {result.components?.map((comp: any, idx: number) => (
                                            <div
                                                key={idx}
                                                onClick={() => setSelectedComponent(selectedComponent === idx ? null : idx)}
                                                className={`p-2 rounded-lg text-xs cursor-pointer transition-all ${selectedComponent === idx
                                                        ? 'bg-amber-500/20 border border-amber-500/50'
                                                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-300">
                                                        <span className="text-amber-400 font-bold mr-2">#{comp.id}</span>
                                                        {comp.nameZH || comp.name}
                                                    </span>
                                                    <span className="text-gray-500 text-[10px]">{comp.material}</span>
                                                </div>
                                                {selectedComponent === idx && (
                                                    <div className="mt-2 pt-2 border-t border-white/10 text-gray-400">
                                                        <p>功能：{comp.function}</p>
                                                        <p>層級：{comp.layer} • 顏色：{comp.color}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Style Options */}
                                    {result.suggestedStyles && (
                                        <div className="space-y-2">
                                            <p className="text-xs text-gray-400 font-medium">🎨 爆炸視圖風格</p>
                                            <div className="flex flex-wrap gap-2">
                                                {result.suggestedStyles.map((style: any, idx: number) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSelectedStyle(idx)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs transition-all ${selectedStyle === idx
                                                                ? 'bg-amber-500 text-white'
                                                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                                            }`}
                                                    >
                                                        {style.style}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Generated Prompt */}
                                    <div className="p-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl">
                                        <p className="text-xs text-amber-300 font-medium mb-2">✨ 爆炸視圖 Prompt</p>
                                        <p className="text-gray-300 text-sm leading-relaxed">
                                            {result.suggestedStyles?.[selectedStyle]?.prompt || result.explodedViewPromptEN}
                                        </p>
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => copyPrompt(result.suggestedStyles?.[selectedStyle]?.prompt || result.explodedViewPromptEN)}
                                                className="flex-1 py-2 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white rounded-lg text-xs transition-all"
                                            >
                                                📋 複製 Prompt
                                            </button>
                                            {onUsePrompt && (
                                                <button
                                                    onClick={() => {
                                                        onUsePrompt(result.suggestedStyles?.[selectedStyle]?.prompt || result.explodedViewPromptEN);
                                                        onClose();
                                                    }}
                                                    className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg text-xs transition-all"
                                                >
                                                    🚀 套用到表單
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Technical Notes */}
                                    {result.technicalNotes && (
                                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                            <p className="text-xs text-blue-300 font-medium mb-1">📝 技術說明</p>
                                            <p className="text-gray-400 text-[10px] leading-relaxed">{result.technicalNotes}</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 py-12">
                                    <span className="text-6xl mb-4">💡</span>
                                    <p className="text-sm text-center">
                                        上傳產品圖片後<br />
                                        AI 將識別所有零件並生成爆炸視圖 Prompt
                                    </p>
                                    <div className="mt-4 text-xs text-gray-600 space-y-1 text-center">
                                        <p>🎯 適合：電子產品、機械零件、傢俱、配件</p>
                                        <p>📐 輸出：零件清單、材質、層級、組裝順序</p>
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
