"use client";

import { Dispatch, SetStateAction } from "react";

interface GalleryToolbarProps {
    // View Mode
    viewMode: 'gallery' | 'map';
    setViewMode: Dispatch<SetStateAction<'gallery' | 'map'>>;

    // Stats
    filteredCount: number;
    totalCount: number;
    selectedTagsCount: number;

    // Selection Mode
    isSelectionMode: boolean;
    setIsSelectionMode: Dispatch<SetStateAction<boolean>>;
    onClearSelection: () => void;

    // Favorites
    showFavoritesOnly: boolean;
    setShowFavoritesOnly: Dispatch<SetStateAction<boolean>>;

    // Tag Filter
    isTagMenuOpen: boolean;
    setIsTagMenuOpen: Dispatch<SetStateAction<boolean>>;
    selectedTags: string[];
    setSelectedTags: Dispatch<SetStateAction<string[]>>;
    allTags: string[];
    onToggleTag: (tag: string) => void;

    // Search
    searchQuery: string;
    setSearchQuery: Dispatch<SetStateAction<string>>;
    useSemanticSearch: boolean;
    setUseSemanticSearch: Dispatch<SetStateAction<boolean>>;
    onSearch: (query: string, semantic: boolean) => void;
    onReindex: () => void;

    // Upload Images
    onUploadImages: (files: FileList) => void;

    // Scroll State
    isScrolled: boolean;

    // Collections
    onToggleSidebar: () => void;
}

export default function GalleryToolbar({
    viewMode,
    setViewMode,
    filteredCount,
    totalCount,
    selectedTagsCount,
    isSelectionMode,
    setIsSelectionMode,
    onClearSelection,
    showFavoritesOnly,
    setShowFavoritesOnly,
    isTagMenuOpen,
    setIsTagMenuOpen,
    selectedTags,
    setSelectedTags,
    allTags,
    onToggleTag,
    searchQuery,
    setSearchQuery,
    useSemanticSearch,
    setUseSemanticSearch,
    onSearch,
    onReindex,
    onUploadImages,
    isScrolled,
    onToggleSidebar
}: GalleryToolbarProps) {
    return (
        <div className={`sticky top-4 z-50 max-w-fit mx-auto transition-all duration-300 ${isScrolled
            ? 'bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/30'
            : 'bg-white/10 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/10'
            } rounded-full h-12 px-3`}>

            <div className="flex items-center gap-2 h-full">
                {/* Collection Sidebar Toggle */}
                <button
                    onClick={onToggleSidebar}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-purple-300 hover:text-white hover:bg-white/10 transition-all mr-1"
                    title="魔導書庫 (Collections)"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </button>
                <div className="w-px h-4 bg-white/10 mx-1" />

                {/* Left: View Toggle + Stats */}
                <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex bg-white/5 p-0.5 rounded-full h-9">
                        <button
                            onClick={() => setViewMode('gallery')}
                            className={`w-9 h-8 flex items-center justify-center rounded-full text-[11px] transition-all ${viewMode === 'gallery' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                            title="畫廊視圖"
                        >
                            🖼️
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`w-9 h-8 flex items-center justify-center rounded-full text-[11px] transition-all ${viewMode === 'map' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                            title="關係圖"
                        >
                            🕸️
                        </button>
                    </div>

                    {/* Compact Stats Badge */}
                    <div className="flex items-center gap-1 bg-white/5 px-2 h-8 rounded-full">
                        <span className="text-[11px] text-gray-300 font-medium whitespace-nowrap">
                            {filteredCount}/{totalCount}
                        </span>
                        {selectedTagsCount > 0 && (
                            <span className="text-[9px] text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded-full">
                                {selectedTagsCount}
                            </span>
                        )}
                    </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-1">
                    {/* Selection Mode */}
                    <button
                        onClick={() => {
                            setIsSelectionMode(!isSelectionMode);
                            if (isSelectionMode) onClearSelection();
                        }}
                        className={`w-9 h-9 flex items-center justify-center rounded-full transition-all group relative ${isSelectionMode
                            ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                            : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                            }`}
                        title="批次選擇"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    </button>

                    {/* Favorites */}
                    <button
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${showFavoritesOnly
                            ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20"
                            : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                            }`}
                        title="最愛"
                    >
                        <svg className={`w-4 h-4 ${showFavoritesOnly ? "fill-current" : "stroke-current fill-none"}`} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>

                    {/* Tag Filter */}
                    <div className="relative">
                        <button
                            onClick={() => setIsTagMenuOpen(!isTagMenuOpen)}
                            className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${selectedTags.length > 0 || isTagMenuOpen
                                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                                }`}
                            title="標籤篩選"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {selectedTags.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-white text-purple-600 text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                                    {selectedTags.length}
                                </span>
                            )}
                        </button>

                        {isTagMenuOpen && (
                            <>
                                <div className="absolute top-12 right-0 z-30 w-72 max-h-96 overflow-y-auto bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4">
                                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
                                        <span className="text-xs text-gray-400">選擇標籤</span>
                                        {selectedTags.length > 0 && (
                                            <button
                                                onClick={() => setSelectedTags([])}
                                                className="text-xs text-red-400 hover:text-red-300"
                                            >
                                                清除
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {allTags.length > 0 ? (
                                            allTags.map(tag => (
                                                <button
                                                    key={tag}
                                                    onClick={() => onToggleTag(tag)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors border ${selectedTags.includes(tag)
                                                        ? "bg-purple-600 border-purple-500 text-white"
                                                        : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
                                                        }`}
                                                >
                                                    {tag}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="text-gray-500 text-xs text-center w-full py-4">暫無標籤</div>
                                        )}
                                    </div>
                                </div>
                                <div className="fixed inset-0 z-20" onClick={() => setIsTagMenuOpen(false)} />
                            </>
                        )}
                    </div>

                    {/* Semantic Search Toggle */}
                    <button
                        onClick={() => setUseSemanticSearch(!useSemanticSearch)}
                        className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${useSemanticSearch
                            ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                            : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                            }`}
                        title={useSemanticSearch ? "語義搜尋已啟用" : "啟用語義搜尋"}
                    >
                        🧠
                    </button>

                    {/* Search Input */}
                    <input
                        type="text"
                        placeholder={useSemanticSearch ? "語義搜尋..." : "搜尋..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && useSemanticSearch) {
                                onSearch(searchQuery, true);
                            }
                        }}
                        className={`h-8 w-48 bg-white/5 border rounded-full px-3 text-[12px] text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 transition-all ${useSemanticSearch ? "border-purple-500/50 focus:ring-purple-500" : "border-white/10 focus:ring-gray-500"
                            }`}
                    />

                    {/* Reindex Button */}
                    {useSemanticSearch && (
                        <button
                            onClick={onReindex}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                            title="重建索引"
                        >
                            ⚙️
                        </button>
                    )}

                    {/* Upload Image */}
                    <input
                        type="file"
                        id="uploadImageInput-toolbar"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                                onUploadImages(files);
                                e.target.value = '';
                            }
                        }}
                    />
                    <button
                        onClick={() => document.getElementById('uploadImageInput-toolbar')?.click()}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 transition-all"
                        title="上傳圖片"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
