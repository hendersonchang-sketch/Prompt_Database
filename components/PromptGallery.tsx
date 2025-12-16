"use client";

import { useEffect, useState } from "react";

interface PromptEntry {
    id: string;
    imageUrl: string | null;
    prompt: string;
    promptZh?: string | null;
    originalPrompt?: string | null;
    width: number;
    height: number;
    tags?: string;
    isFavorite: boolean;
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
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-end items-center gap-4">
                <button
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${showFavoritesOnly
                        ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20"
                        : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                        }`}
                >
                    <svg className={`w-4 h-4 ${showFavoritesOnly ? "fill-current" : "stroke-current fill-none"}`} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    只看最愛
                </button>

                {/* Tag Filter Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsTagMenuOpen(!isTagMenuOpen)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedTags.length > 0 || isTagMenuOpen
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
                        onClick={() => setSelectedImage(item)}
                        className="break-inside-avoid group relative bg-white/5 rounded-2xl overflow-hidden border border-white/10 transition-all hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer"
                    >
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

                            <p className="text-white text-xs line-clamp-2 font-medium mb-3">{item.prompt}</p>

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
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm("確定要刪除這張圖片嗎？")) handleDelete(item.id);
                                        }}
                                        className="p-2 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white rounded-full transition-colors"
                                        title="刪除"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8">
                        {/* Content wrapper */}
                        <div
                            className="relative w-full max-w-6xl flex flex-col items-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={selectedImage.imageUrl || ""}
                                alt={selectedImage.prompt}
                                className="w-auto max-h-[75vh] object-contain rounded-lg shadow-2xl mb-6"
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
                                                    <p className="text-xs text-gray-400 mb-1">中文提示詞</p>
                                                    <p className="text-sm md:text-base leading-relaxed text-gray-100 font-light select-text">
                                                        {selectedImage.promptZh}
                                                    </p>
                                                </div>
                                            )}

                                            <div>
                                                <p className="text-xs text-gray-400 mb-1">英文提示詞 (實際生成)</p>
                                                <p className="text-sm md:text-base leading-relaxed text-gray-300 font-mono text-xs select-text">
                                                    {selectedImage.prompt}
                                                </p>
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
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
        </div>
    );
}
