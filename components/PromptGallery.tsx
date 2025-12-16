"use client";

import { useEffect, useState } from "react";
import ABCompare from "./ABCompare";

interface PromptEntry {
    id: string;
    imageUrl: string | null;
    prompt: string;
    negativePrompt?: string | null;
    promptZh?: string | null;
    originalPrompt?: string | null;
    width: number;
    height: number;
    tags?: string;
    isFavorite: boolean;
    seed?: number;
    cfgScale?: number;
    steps?: number;
    sampler?: string;
}

interface PromptGalleryProps {
    refreshTrigger: number;
    onReuse?: (data: any) => void;
}

export default function PromptGallery({ refreshTrigger, onReuse }: PromptGalleryProps) {
    const [prompts, setPrompts] = useState<PromptEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedImage, setSelectedImage] = useState<PromptEntry | null>(null);

    // Tag Filtering State
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);

    // Batch Selection Mode
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Variation Menu State
    const [isVariationMenuOpen, setIsVariationMenuOpen] = useState(false);
    const [variationLoading, setVariationLoading] = useState(false);
    const [selectedInstructions, setSelectedInstructions] = useState<string[]>([]);

    // A/B Comparison State
    const [compareImages, setCompareImages] = useState<{ a: string; b: string } | null>(null);

    // Extract Unique Tags
    const allTags = Array.from(new Set(
        prompts.flatMap(p => p.tags ? p.tags.split(',').map(t => t.trim()) : [])
    )).sort();

    useEffect(() => {
        fetchPrompts();
    }, [refreshTrigger]);

    const fetchPrompts = async () => {
        try {
            const res = await fetch("/api/prompts");
            const data = await res.json();
            setPrompts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
        e.stopPropagation();
        // Optimistic Update
        setPrompts(prev => prev.map(p => p.id === id ? { ...p, isFavorite: !currentStatus } : p));
        if (selectedImage && selectedImage.id === id) {
            setSelectedImage(prev => prev ? { ...prev, isFavorite: !currentStatus } : null);
        }

        try {
            await fetch(`/api/prompts/${id}/`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isFavorite: !currentStatus })
            });
        } catch (error) {
            console.error("Failed to toggle favorite", error);
            // Revert on failure
            setPrompts(prev => prev.map(p => p.id === id ? { ...p, isFavorite: currentStatus } : p));
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/prompts/${id}`, { method: "DELETE" });
            if (res.ok) {
                setPrompts((prev) => prev.filter((p) => p.id !== id));
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Batch Delete
    const handleBatchDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`確定要刪除這 ${selectedIds.size} 張圖片嗎？`)) return;

        try {
            const res = await fetch('/api/prompts/batch', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            });
            if (res.ok) {
                setPrompts(prev => prev.filter(p => !selectedIds.has(p.id)));
                setSelectedIds(new Set());
                setIsSelectionMode(false);
            }
        } catch (error) {
            console.error('Batch delete failed:', error);
        }
    };

    // Toggle single item selection
    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Select/Deselect All
    const toggleSelectAll = () => {
        if (selectedIds.size === filteredPrompts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredPrompts.map(p => p.id)));
        }
    };

    const handleReuse = () => {
        if (selectedImage && onReuse) {
            // Prioritize originalPrompt if available, otherwise promptZh (if it exists), otherwise fallback to prompt
            // Actually, for consistency, if originalPrompt exists, use it. 
            // If not, we still prefer 'prompt' usually unless user wants to edit in Chinese.
            // Let's pass the object and let Form decide or just pass the best string.
            // The requirement says: "original language prompt fill back".
            const reuseText = selectedImage.originalPrompt || selectedImage.prompt;
            onReuse({ ...selectedImage, prompt: reuseText });
            setSelectedImage(null);
        }
    };

    const handleCopyPrompt = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            alert("已複製到剪貼簿！");
        } catch (err) {
            console.error("Failed to copy", err);
        }
    };

    const filteredPrompts = prompts.filter((p) => {
        const matchesSearch = p.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.tags && p.tags.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesFav = showFavoritesOnly ? p.isFavorite : true;

        // Tag Filter (AND Logic)
        const itemTags = p.tags ? p.tags.split(',').map(t => t.trim()) : [];
        const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => itemTags.includes(tag));

        return matchesSearch && matchesFav && matchesTags;
    });

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    if (loading) return <div className="text-center p-10 opacity-50">載入畫廊中...</div>;

    return (
        <div className="w-full max-w-[1600px] px-4 space-y-8">
            {/* Batch Action Bar */}
            {isSelectionMode && (
                <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-xl animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleSelectAll}
                            className="text-sm text-white hover:text-red-200 transition-colors"
                        >
                            {selectedIds.size === filteredPrompts.length ? "取消全選" : "全選"}
                        </button>
                        <span className="text-sm text-red-200">
                            已選擇 <span className="font-bold text-white">{selectedIds.size}</span> 張
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setIsSelectionMode(false);
                                setSelectedIds(new Set());
                            }}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            取消
                        </button>

                        {/* Export Button */}
                        <button
                            onClick={async () => {
                                const selectedPrompts = prompts.filter(p => selectedIds.has(p.id));
                                if (selectedPrompts.length === 0) return;

                                // Create export data
                                const exportData = {
                                    exportDate: new Date().toISOString(),
                                    itemCount: selectedPrompts.length,
                                    items: selectedPrompts.map(p => ({
                                        id: p.id,
                                        prompt: p.prompt,
                                        promptZh: p.promptZh,
                                        negativePrompt: p.negativePrompt,
                                        tags: p.tags,
                                        width: p.width,
                                        height: p.height,
                                        seed: p.seed,
                                        steps: p.steps,
                                        cfgScale: p.cfgScale,
                                        sampler: p.sampler,
                                        imageUrl: p.imageUrl
                                    }))
                                };

                                // Download as JSON
                                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `prompt-export-${new Date().toISOString().slice(0, 10)}.json`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);

                                alert(`已匯出 ${selectedPrompts.length} 筆資料！`);
                            }}
                            disabled={selectedIds.size === 0}
                            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            匯出 ({selectedIds.size})
                        </button>

                        {/* A/B Compare Button - only when exactly 2 selected */}
                        {selectedIds.size === 2 && (
                            <button
                                onClick={() => {
                                    const ids = Array.from(selectedIds);
                                    const imgA = prompts.find(p => p.id === ids[0])?.imageUrl;
                                    const imgB = prompts.find(p => p.id === ids[1])?.imageUrl;
                                    if (imgA && imgB) {
                                        setCompareImages({ a: imgA, b: imgB });
                                    }
                                }}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                ⚖️ A/B 對比
                            </button>
                        )}

                        {/* Style Fusion Button - only when exactly 2 selected */}
                        {selectedIds.size === 2 && (
                            <button
                                onClick={async () => {
                                    const ids = Array.from(selectedIds);
                                    const imgA = prompts.find(p => p.id === ids[0]);
                                    const imgB = prompts.find(p => p.id === ids[1]);
                                    if (!imgA?.imageUrl || !imgB?.imageUrl) return;

                                    try {
                                        // Use prompts to fuse styles
                                        const res = await fetch('/api/variation', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                prompt: imgA.prompt,
                                                variationType: 'custom',
                                                customInstruction: `Fuse the style with another image that has this prompt: "${imgB.prompt}". Combine the best visual elements, colors, and moods from both prompts into one cohesive prompt.`,
                                                apiKey: localStorage.getItem('geminiApiKey') || ''
                                            }),
                                        });
                                        if (!res.ok) throw new Error(await res.text());
                                        const data = await res.json();
                                        if (data.variation && onReuse) {
                                            onReuse({ prompt: data.variation });
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                            setIsSelectionMode(false);
                                            setSelectedIds(new Set());
                                        }
                                    } catch (err) {
                                        alert('風格融合失敗');
                                    }
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-500 hover:to-orange-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                🎨 風格融合
                            </button>
                        )}

                        <button
                            onClick={handleBatchDelete}
                            disabled={selectedIds.size === 0}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            刪除 ({selectedIds.size})
                        </button>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="grid grid-cols-3 md:flex md:flex-row md:justify-end items-center gap-2 md:gap-4 w-full">
                {/* Selection Mode Toggle */}
                <button
                    onClick={() => {
                        setIsSelectionMode(!isSelectionMode);
                        if (isSelectionMode) setSelectedIds(new Set());
                    }}
                    className={`flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all ${isSelectionMode
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                        : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                        }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span className="hidden sm:inline">{isSelectionMode ? "退出選擇" : "批次"}</span>
                </button>

                <button
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={`flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all ${showFavoritesOnly
                        ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20"
                        : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                        }`}
                >
                    <svg className={`w-4 h-4 ${showFavoritesOnly ? "fill-current" : "stroke-current fill-none"}`} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="hidden sm:inline">最愛</span>
                </button>

                {/* Import Button */}
                <div className="relative">
                    <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        id="import-file"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            try {
                                const text = await file.text();
                                const data = JSON.parse(text);

                                const res = await fetch('/api/import', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: text,
                                });

                                if (!res.ok) throw new Error(await res.text());
                                const result = await res.json();

                                alert(`匯入完成！\n成功: ${result.imported}\n跳過: ${result.skipped}\n總計: ${result.total}`);

                                // Refresh the gallery
                                window.location.reload();
                            } catch (err: any) {
                                alert('匯入失敗: ' + (err.message || '未知錯誤'));
                            }

                            // Reset input
                            e.target.value = '';
                        }}
                    />
                    <label
                        htmlFor="import-file"
                        className="flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span className="hidden sm:inline">匯入</span>
                    </label>
                </div>

                {/* Backup/Export All Button */}
                <button
                    onClick={async () => {
                        try {
                            const res = await fetch('/api/backup');
                            if (!res.ok) throw new Error('備份失敗');

                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `prompt-database-backup-${Date.now()}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                        } catch (err) {
                            alert('備份失敗');
                        }
                    }}
                    className="flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                    title="備份所有資料"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span className="hidden sm:inline">備份</span>
                </button>

                {/* Tag Filter Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsTagMenuOpen(!isTagMenuOpen)}
                        className={`flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all ${selectedTags.length > 0 || isTagMenuOpen
                            ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                            : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        標籤篩選
                        {selectedTags.length > 0 && (
                            <span className="bg-white text-purple-600 text-[10px] font-bold px-1.5 rounded-full min-w-[1.2rem] h-[1.2rem] flex items-center justify-center">
                                {selectedTags.length}
                            </span>
                        )}
                    </button>

                    {/* Dropdown Menu */}
                    {isTagMenuOpen && (
                        <div className="absolute top-12 right-0 z-30 w-72 max-h-96 overflow-y-auto bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
                                <span className="text-xs text-gray-400">選擇標籤 (多選)</span>
                                {selectedTags.length > 0 && (
                                    <button
                                        onClick={() => setSelectedTags([])}
                                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        清除全部
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {allTags.length > 0 ? (
                                    allTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            className={`px-3 py-1.5 rounded-lg text-xs transition-colors border ${selectedTags.includes(tag)
                                                ? "bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-500/20"
                                                : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-gray-500 text-xs text-center w-full py-4">
                                        暫無可用標籤
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Backdrop to close */}
                    {isTagMenuOpen && (
                        <div className="fixed inset-0 z-20" onClick={() => setIsTagMenuOpen(false)} />
                    )}
                </div>

                <input
                    type="text"
                    placeholder="搜尋提示詞或標籤..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all w-full md:w-64 focus:w-80"
                />
            </div>

            {/* Masonry Grid */}
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                {filteredPrompts.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => {
                            if (isSelectionMode) {
                                toggleSelection(item.id);
                            } else {
                                setSelectedImage(item);
                            }
                        }}
                        className={`break-inside-avoid group relative bg-white/5 rounded-2xl overflow-hidden border transition-all hover:shadow-xl cursor-pointer ${selectedIds.has(item.id)
                            ? "border-red-500 shadow-lg shadow-red-500/20"
                            : "border-white/10 hover:shadow-purple-500/10"
                            }`}
                    >
                        {/* Selection Checkbox */}
                        {isSelectionMode && (
                            <div className="absolute top-3 left-3 z-10">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedIds.has(item.id)
                                    ? "bg-red-500 border-red-500"
                                    : "bg-black/50 border-white/50 group-hover:border-white"
                                    }`}>
                                    {selectedIds.has(item.id) && (
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        )}

                        {item.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={item.imageUrl}
                                alt={item.prompt}
                                className="w-full h-auto object-cover"
                                loading="lazy"
                            />
                        )}

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1 mb-2">
                                {item.tags && item.tags.split(',').slice(0, 3).map((tag, idx) => (
                                    <span
                                        key={idx}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Add to selected tags instead of replacing search query
                                            toggleTag(tag.trim());
                                        }}
                                        className={`text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm cursor-pointer transition-colors ${selectedTags.includes(tag.trim())
                                            ? "bg-purple-500 text-white"
                                            : "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
                                            }`}
                                    >
                                        {tag.trim()}
                                    </span>
                                ))}
                            </div>

                            <p className="text-white text-xs line-clamp-2 font-medium mb-3">
                                {item.promptZh || item.prompt}
                            </p>

                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-400">
                                    {item.width}x{item.height}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => toggleFavorite(e, item.id, item.isFavorite)}
                                        className={`p-2 rounded-full transition-colors ${item.isFavorite ? "text-pink-500 bg-pink-500/10" : "text-white/50 hover:text-white hover:bg-white/10"}`}
                                        title={item.isFavorite ? "移除最愛" : "加入最愛"}
                                    >
                                        <svg className={`w-4 h-4 ${item.isFavorite ? "fill-current" : "stroke-current fill-none"}`} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </button>
                                    {/* Quick Chain Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedImage(item);
                                            setIsVariationMenuOpen(true);
                                        }}
                                        className="p-2 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-200 hover:text-white rounded-full transition-colors"
                                        title="接龍變體"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm("確定要刪除這張圖片嗎？")) handleDelete(item.id);
                                        }}
                                        className="p-2 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white rounded-full transition-colors"
                                        title="刪除"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Always visible Favorite Icon if active */}
                        {item.isFavorite && (
                            <div className="absolute top-2 right-2 text-pink-500 drop-shadow-md">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredPrompts.length === 0 && (
                <div className="text-center text-gray-500 py-20 flex flex-col items-center">
                    <p className="text-lg">這裡空空如也。</p>
                    {showFavoritesOnly && <p className="text-sm">試著去把一些喜歡的圖片加入最愛吧！</p>}
                </div>
            )}

            {/* Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md overflow-y-auto"
                    onClick={() => setSelectedImage(null)}
                >
                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="fixed top-4 right-4 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors md:hidden"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="min-h-screen w-full flex flex-col items-center justify-start md:justify-center p-4 md:p-8 pt-16 md:pt-8">
                        {/* Content wrapper */}
                        <div
                            className="relative w-full max-w-6xl flex flex-col items-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={selectedImage.imageUrl || ""}
                                alt={selectedImage.prompt}
                                className="w-full md:w-auto max-h-[50vh] md:max-h-[75vh] object-contain rounded-lg shadow-2xl mb-4 md:mb-6"
                            />

                            <div className="w-full bg-black/60 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/10 text-white shadow-2xl">
                                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">

                                    {/* Info Section */}
                                    <div className="flex-1 min-w-0 space-y-4">
                                        {/* Header: Dims + Tags + Fav */}
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="text-xs font-mono text-gray-400 border border-white/20 px-2 py-1 rounded">
                                                {selectedImage.width} x {selectedImage.height}
                                            </span>

                                            {/* Scrollable Tags or Horizontal List */}
                                            {selectedImage.tags && (
                                                <div className="flex flex-wrap gap-2 items-center">
                                                    {selectedImage.tags.split(',').map((tag, i) => (
                                                        <span
                                                            key={i}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleTag(tag.trim());
                                                                setSelectedImage(null);
                                                            }}
                                                            className={`text-xs px-2.5 py-1 rounded-full border cursor-pointer transition-colors whitespace-nowrap ${selectedTags.includes(tag.trim())
                                                                ? "bg-purple-600 border-purple-500 text-white"
                                                                : "bg-purple-500/20 text-purple-200 border-purple-500/30 hover:bg-purple-500/40"
                                                                }`}
                                                        >
                                                            {tag.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {selectedImage.isFavorite && (
                                                <span className="ml-auto md:ml-2 text-xs text-pink-400 flex items-center gap-1 font-medium bg-pink-500/10 px-2 py-1 rounded-full border border-pink-500/20">
                                                    <span className="text-sm">♥</span> 已收藏
                                                </span>
                                            )}
                                        </div>

                                        <div className="bg-black/40 rounded-xl p-4 border border-white/5 space-y-3">
                                            {selectedImage.promptZh && (
                                                <div className="pb-3 border-b border-white/10">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <p className="text-xs text-gray-400">中文提示詞</p>
                                                        <button
                                                            onClick={() => handleCopyPrompt(selectedImage.promptZh!)}
                                                            className="text-[10px] text-gray-500 hover:text-white transition-colors"
                                                        >
                                                            複製
                                                        </button>
                                                    </div>
                                                    <p className="text-sm md:text-base leading-relaxed text-gray-100 font-light select-text">
                                                        {selectedImage.promptZh}
                                                    </p>
                                                </div>
                                            )}

                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-xs text-gray-400">英文提示詞 (實際生成)</p>
                                                    <button
                                                        onClick={() => handleCopyPrompt(selectedImage.prompt)}
                                                        className="text-[10px] text-gray-500 hover:text-white transition-colors"
                                                    >
                                                        複製
                                                    </button>
                                                </div>
                                                <p className="text-sm md:text-base leading-relaxed text-gray-300 font-mono text-xs select-text">
                                                    {selectedImage.prompt}
                                                </p>
                                            </div>

                                            {/* Technical Details Grid */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-white/10">
                                                <div className="bg-white/5 rounded p-2 text-center">
                                                    <div className="text-[10px] text-gray-500">Seed</div>
                                                    <div className="text-xs font-mono text-purple-300">{selectedImage.seed}</div>
                                                </div>
                                                <div className="bg-white/5 rounded p-2 text-center">
                                                    <div className="text-[10px] text-gray-500">Steps</div>
                                                    <div className="text-xs font-mono text-blue-300">{selectedImage.steps}</div>
                                                </div>
                                                <div className="bg-white/5 rounded p-2 text-center">
                                                    <div className="text-[10px] text-gray-500">CFG Scale</div>
                                                    <div className="text-xs font-mono text-green-300">{selectedImage.cfgScale}</div>
                                                </div>
                                                <div className="bg-white/5 rounded p-2 text-center">
                                                    <div className="text-[10px] text-gray-500">Sampler</div>
                                                    <div className="text-xs font-mono text-amber-300 truncate" title={selectedImage.sampler || ""}>{selectedImage.sampler || "N/A"}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons (Vertical on mobile, Stacked on Desktop side) */}
                                    <div className="flex flex-row md:flex-col gap-3 shrink-0 w-full md:w-48 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                                        <button
                                            onClick={(e) => toggleFavorite(e, selectedImage.id, selectedImage.isFavorite)}
                                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${selectedImage.isFavorite ? "bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-900/20" : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"}`}
                                        >
                                            <svg className={`w-4 h-4 ${selectedImage.isFavorite ? "fill-white" : "stroke-current fill-none"}`} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                            {selectedImage.isFavorite ? "已收藏" : "收藏"}
                                        </button>

                                        <button
                                            onClick={handleReuse}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-purple-900/20 whitespace-nowrap"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            重練
                                        </button>

                                        <button
                                            onClick={() => handleCopyPrompt(selectedImage.prompt)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/30 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                            </svg>
                                            複製 Prompt
                                        </button>

                                        {/* Reverse Prompt Button */}
                                        <button
                                            onClick={async () => {
                                                if (!selectedImage.imageUrl) return;
                                                setVariationLoading(true);
                                                try {
                                                    // Fetch image as base64
                                                    const imgRes = await fetch(selectedImage.imageUrl);
                                                    const blob = await imgRes.blob();
                                                    const base64 = await new Promise<string>((resolve) => {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => resolve(reader.result as string);
                                                        reader.readAsDataURL(blob);
                                                    });

                                                    const res = await fetch('/api/describe', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            image: base64,
                                                            apiKey: localStorage.getItem('geminiApiKey') || ''
                                                        }),
                                                    });
                                                    if (!res.ok) throw new Error(await res.text());
                                                    const data = await res.json();
                                                    if (data.prompt && onReuse) {
                                                        onReuse({ prompt: data.prompt });
                                                        setSelectedImage(null);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }
                                                } catch (err) {
                                                    alert('反推 Prompt 失敗');
                                                } finally {
                                                    setVariationLoading(false);
                                                }
                                            }}
                                            disabled={variationLoading}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-600/20 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/30 rounded-xl text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-50"
                                            title="分析圖片，反推生成 Prompt"
                                        >
                                            🔍 反推
                                        </button>

                                        {/* Prompt Chain / Variation Button */}
                                        <div className="relative flex-1">
                                            <button
                                                onClick={() => setIsVariationMenuOpen(!isVariationMenuOpen)}
                                                disabled={variationLoading}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-600/20 to-teal-600/20 hover:from-cyan-600 hover:to-teal-600 text-cyan-200 hover:text-white border border-cyan-500/30 rounded-xl text-sm font-medium transition-all whitespace-nowrap disabled:opacity-50"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                </svg>
                                                {variationLoading ? '生成中...' : '接龍'}
                                            </button>

                                            {isVariationMenuOpen && (
                                                <div className="absolute bottom-full left-0 mb-2 w-72 bg-gray-900 border border-white/20 rounded-xl shadow-xl overflow-hidden z-50 max-h-[450px] flex flex-col">
                                                    {/* Header with count */}
                                                    <div className="px-3 py-2 border-b border-white/10 flex justify-between items-center shrink-0">
                                                        <span className="text-xs text-gray-400">選擇效果組合</span>
                                                        {selectedInstructions.length > 0 && (
                                                            <button
                                                                onClick={() => setSelectedInstructions([])}
                                                                className="text-xs text-red-400 hover:text-red-300"
                                                            >
                                                                清除 ({selectedInstructions.length})
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Scrollable options */}
                                                    <div className="overflow-y-auto flex-1">
                                                        {[
                                                            {
                                                                category: '🌄 場景',
                                                                options: [
                                                                    { label: '海邊沙灘', instruction: 'Place the subject on a sunny beach with ocean waves' },
                                                                    { label: '城市街頭', instruction: 'Place the subject on a busy city street with buildings' },
                                                                    { label: '森林小徑', instruction: 'Place the subject in a magical forest path' },
                                                                    { label: '咖啡廳', instruction: 'Place the subject inside a cozy cafe' },
                                                                    { label: '太空/星空', instruction: 'Place the subject in outer space with stars' },
                                                                ]
                                                            },
                                                            {
                                                                category: '🎨 風格',
                                                                options: [
                                                                    { label: '動漫風', instruction: 'Convert to anime/manga art style' },
                                                                    { label: '油畫風', instruction: 'Convert to oil painting style with visible brushstrokes' },
                                                                    { label: '水彩風', instruction: 'Convert to soft watercolor painting style' },
                                                                    { label: '3D 渲染', instruction: 'Convert to 3D rendered style like Pixar' },
                                                                    { label: '像素風', instruction: 'Convert to pixel art retro game style' },
                                                                    { label: '賽博龐克', instruction: 'Convert to cyberpunk neon aesthetic' },
                                                                ]
                                                            },
                                                            {
                                                                category: '❄️ 季節',
                                                                options: [
                                                                    { label: '🌸 春天', instruction: 'Change to spring atmosphere. If outdoor: add cherry blossoms, fresh green leaves, spring flowers. If indoor: add spring decorations, soft natural light, flowers in vases.' },
                                                                    { label: '☀️ 夏天', instruction: 'Change to summer atmosphere. If outdoor: bright sunlight, lush green. If indoor: summer light through windows, cooling elements, tropical plants.' },
                                                                    { label: '🍂 秋天', instruction: 'Change to autumn atmosphere. If outdoor: orange/red falling leaves, harvest colors. If indoor: warm lighting, autumn decorations, cozy blankets.' },
                                                                    { label: '❄️ 冬天', instruction: 'Change to winter atmosphere. If outdoor: snow on ground, bare trees, cold breath visible. If indoor: NO SNOW INSIDE, instead add cozy winter elements like fireplace, warm lighting, hot drinks, winter decorations, snow visible only through windows.' },
                                                                ]
                                                            },
                                                            {
                                                                category: '⏰ 時間',
                                                                options: [
                                                                    { label: '日出', instruction: 'Change to sunrise with golden morning light' },
                                                                    { label: '正午', instruction: 'Change to bright midday with harsh sunlight' },
                                                                    { label: '黃昏', instruction: 'Change to sunset golden hour' },
                                                                    { label: '夜晚', instruction: 'Change to nighttime with moonlight or city lights' },
                                                                    { label: '下雨天', instruction: 'Add rain and wet surfaces' },
                                                                ]
                                                            },
                                                            {
                                                                category: '🔍 距離',
                                                                options: [
                                                                    { label: '大特寫', instruction: 'Extreme close-up on face/detail only' },
                                                                    { label: '半身照', instruction: 'Medium shot showing upper body' },
                                                                    { label: '全身照', instruction: 'Full body shot' },
                                                                    { label: '遠景', instruction: 'Wide shot showing full environment' },
                                                                    { label: '鳥瞰', instruction: 'Bird eye view from above' },
                                                                ]
                                                            },
                                                            {
                                                                category: '🎭 情緒',
                                                                options: [
                                                                    { label: '開心歡樂', instruction: 'Change mood to happy and joyful' },
                                                                    { label: '憂傷寂寞', instruction: 'Change mood to sad and melancholic' },
                                                                    { label: '神秘詭異', instruction: 'Change mood to mysterious and eerie' },
                                                                    { label: '浪漫溫馨', instruction: 'Change mood to romantic and warm' },
                                                                    { label: '緊張刺激', instruction: 'Change mood to tense and exciting' },
                                                                ]
                                                            },
                                                        ].map(cat => (
                                                            <div key={cat.category}>
                                                                <div className="px-3 py-2 bg-white/5 text-xs text-gray-400 font-medium sticky top-0">
                                                                    {cat.category}
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-1 p-1">
                                                                    {cat.options.map(opt => {
                                                                        const isSelected = selectedInstructions.includes(opt.instruction);
                                                                        return (
                                                                            <button
                                                                                key={opt.label}
                                                                                onClick={() => {
                                                                                    setSelectedInstructions(prev =>
                                                                                        isSelected
                                                                                            ? prev.filter(i => i !== opt.instruction)
                                                                                            : [...prev, opt.instruction]
                                                                                    );
                                                                                }}
                                                                                className={`px-2 py-1.5 text-xs rounded transition-colors text-center ${isSelected
                                                                                    ? 'bg-cyan-600 text-white'
                                                                                    : 'text-white hover:bg-cyan-600/40'
                                                                                    }`}
                                                                            >
                                                                                {isSelected && '✓ '}{opt.label}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Custom Instruction */}
                                                        <div className="p-2 border-t border-white/10">
                                                            <div className="text-xs text-gray-500 px-2 py-1">✏️ 自訂指令</div>
                                                            <input
                                                                type="text"
                                                                placeholder="例：加一隻狗在旁邊"
                                                                className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        const input = e.target as HTMLInputElement;
                                                                        const customInstruction = input.value.trim();
                                                                        if (customInstruction) {
                                                                            setSelectedInstructions(prev => [...prev, customInstruction]);
                                                                            input.value = '';
                                                                        }
                                                                    }
                                                                }}
                                                            />
                                                            <div className="text-[10px] text-gray-600 px-2 mt-1">按 Enter 加入</div>
                                                        </div>
                                                    </div>

                                                    {/* Generate Button - Fixed at bottom */}
                                                    <div className="p-2 border-t border-white/10 bg-gray-900 shrink-0">
                                                        <button
                                                            disabled={selectedInstructions.length === 0 || variationLoading}
                                                            onClick={async () => {
                                                                setIsVariationMenuOpen(false);
                                                                setVariationLoading(true);
                                                                try {
                                                                    const combinedInstruction = selectedInstructions.join('. Also, ');
                                                                    const res = await fetch('/api/variation', {
                                                                        method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({
                                                                            prompt: selectedImage.prompt,
                                                                            variationType: 'custom',
                                                                            customInstruction: combinedInstruction,
                                                                            apiKey: localStorage.getItem('geminiApiKey') || ''
                                                                        }),
                                                                    });
                                                                    if (!res.ok) throw new Error(await res.text());
                                                                    const data = await res.json();
                                                                    if (data.variation && onReuse) {
                                                                        onReuse({ prompt: data.variation });
                                                                        setSelectedImage(null);
                                                                        setSelectedInstructions([]);
                                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                    }
                                                                } catch (err) {
                                                                    alert('接龍生成失敗');
                                                                } finally {
                                                                    setVariationLoading(false);
                                                                }
                                                            }}
                                                            className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {variationLoading ? '生成中...' : `🚀 組合生成 (${selectedInstructions.length})`}
                                                        </button>

                                                        {/* Batch Random Variations Button */}
                                                        <button
                                                            disabled={variationLoading}
                                                            onClick={async () => {
                                                                setIsVariationMenuOpen(false);
                                                                setVariationLoading(true);
                                                                try {
                                                                    const res = await fetch('/api/batch-variation', {
                                                                        method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({
                                                                            prompt: selectedImage.prompt,
                                                                            count: 3,
                                                                            apiKey: localStorage.getItem('geminiApiKey') || ''
                                                                        }),
                                                                    });
                                                                    if (!res.ok) throw new Error(await res.text());
                                                                    const data = await res.json();
                                                                    if (data.variations && data.variations.length > 0) {
                                                                        // Show modal with 3 variations to choose from (now with Chinese)
                                                                        const v = data.variations;
                                                                        const choice = prompt(
                                                                            `🎲 3 個隨機變體（可多選）：\n\n` +
                                                                            `1️⃣ ${v[0]?.zh || v[0]?.en?.substring(0, 60) || ''}\n` +
                                                                            `   ${v[0]?.en?.substring(0, 50)}...\n\n` +
                                                                            `2️⃣ ${v[1]?.zh || v[1]?.en?.substring(0, 60) || ''}\n` +
                                                                            `   ${v[1]?.en?.substring(0, 50)}...\n\n` +
                                                                            `3️⃣ ${v[2]?.zh || v[2]?.en?.substring(0, 60) || ''}\n` +
                                                                            `   ${v[2]?.en?.substring(0, 50)}...\n\n` +
                                                                            `輸入數字（可用逗號分隔，如 1,3 或 1,2,3）`
                                                                        );
                                                                        if (choice) {
                                                                            // Parse comma-separated choices
                                                                            const selectedIndices = choice
                                                                                .split(/[,，\s]+/)
                                                                                .map(s => parseInt(s.trim()) - 1)
                                                                                .filter(idx => idx >= 0 && idx < 3);

                                                                            if (selectedIndices.length > 0) {
                                                                                // Store prompts in localStorage for queue
                                                                                const selectedPrompts = selectedIndices
                                                                                    .map(idx => v[idx]?.en || v[idx])
                                                                                    .filter(p => p);

                                                                                if (selectedPrompts.length > 1) {
                                                                                    // Store remaining prompts in queue
                                                                                    localStorage.setItem('promptQueue', JSON.stringify(selectedPrompts.slice(1)));
                                                                                    alert(`已選擇 ${selectedPrompts.length} 個變體！\n第一個已填入，其餘 ${selectedPrompts.length - 1} 個在佇列中。\n生成完後可點「📋 下一個」繼續。`);
                                                                                }

                                                                                // Use first prompt
                                                                                if (selectedPrompts[0] && onReuse) {
                                                                                    onReuse({ prompt: selectedPrompts[0] });
                                                                                    setSelectedImage(null);
                                                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                } catch (err) {
                                                                    alert('批次生成失敗');
                                                                } finally {
                                                                    setVariationLoading(false);
                                                                }
                                                            }}
                                                            className="w-full py-2 mt-2 bg-purple-600/20 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            🎲 隨機生成 3 版本
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <a
                                            href={selectedImage.imageUrl || ""}
                                            download={`prompt-db-${selectedImage.id}.png`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            下載
                                        </a>

                                        {/* Remove Background Button */}
                                        <button
                                            onClick={async () => {
                                                if (!selectedImage.imageUrl) return;
                                                setVariationLoading(true);
                                                try {
                                                    // Fetch image as base64
                                                    const imgRes = await fetch(selectedImage.imageUrl);
                                                    const blob = await imgRes.blob();
                                                    const base64 = await new Promise<string>((resolve) => {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => resolve(reader.result as string);
                                                        reader.readAsDataURL(blob);
                                                    });

                                                    const res = await fetch('/api/remove-bg', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            imageBase64: base64.split(',')[1],
                                                            mimeType: blob.type,
                                                            apiKey: localStorage.getItem('geminiApiKey') || ''
                                                        }),
                                                    });
                                                    if (!res.ok) {
                                                        const err = await res.json();
                                                        throw new Error(err.error || '去背失敗');
                                                    }
                                                    const data = await res.json();
                                                    if (data.imageBase64) {
                                                        // Download the result
                                                        const a = document.createElement('a');
                                                        a.href = `data:${data.mimeType};base64,${data.imageBase64}`;
                                                        a.download = `bg-removed-${selectedImage.id}.png`;
                                                        a.click();
                                                        alert('去背完成！已自動下載。');
                                                    }
                                                } catch (err: any) {
                                                    alert(err.message || '去背功能暫不支援此圖片');
                                                } finally {
                                                    setVariationLoading(false);
                                                }
                                            }}
                                            disabled={variationLoading}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/30 rounded-xl text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-50"
                                            title="移除圖片背景"
                                        >
                                            ✂️ 去背
                                        </button>

                                        <button
                                            onClick={() => {
                                                if (confirm("確定要在檢視模式下刪除嗎？")) {
                                                    handleDelete(selectedImage.id);
                                                    setSelectedImage(null);
                                                }
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            刪除
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedImage(null)}
                                className="fixed top-4 right-4 md:absolute md:-top-12 md:-right-12 p-2 bg-black/50 md:bg-transparent rounded-full text-white/70 hover:text-white transition-colors z-50"
                            >
                                <svg className="w-8 h-8 md:w-10 md:h-10 border-2 border-transparent hover:border-white/20 rounded-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* A/B Comparison Modal */}
            {compareImages && (
                <ABCompare
                    imageA={compareImages.a}
                    imageB={compareImages.b}
                    labelA="圖片 A"
                    labelB="圖片 B"
                    onClose={() => setCompareImages(null)}
                />
            )}
        </div>
    );
}
