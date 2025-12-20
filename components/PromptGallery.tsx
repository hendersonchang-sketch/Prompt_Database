"use client";

import { useEffect, useState, useRef } from "react";
import ABCompare from "./ABCompare";
import StyleFusionDialog from "./StyleFusionDialog";

import InspirationMap from "./InspirationMap";
import ImageEditor from "./ImageEditor";
import GalleryToolbar from "./GalleryToolbar";
import { ImageModal } from "./ImageModal";
import { PromptCard, PromptEntry } from "./PromptCard";
import {
    Search, Trash2, Loader2, Download, Zap, X
} from "lucide-react";


interface PromptGalleryProps {
    refreshTrigger: number;
    onReuse?: (data: any) => void;
    onSetAsReference?: (image: any) => void;
}

export default function PromptGallery({ refreshTrigger, onReuse, onSetAsReference }: PromptGalleryProps) {
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

    // A/B Comparison State
    const [compareImages, setCompareImages] = useState<{ a: string; b: string } | null>(null);

    // Style Fusion Dialog State
    const [fusionDialogData, setFusionDialogData] = useState<{
        imageA: PromptEntry;
        imageB: PromptEntry;
    } | null>(null);
    const [fusionLoading, setFusionLoading] = useState(false);

    const [editorImage, setEditorImage] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'gallery' | 'map'>('gallery');

    const [useSemanticSearch, setUseSemanticSearch] = useState(false);

    // Infinite Scroll Pagination State
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);

    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    // Scroll state for sticky header
    const [isScrolled, setIsScrolled] = useState(false);

    // Extract Unique Tags
    const allTags = Array.from(new Set(
        prompts.flatMap(p => p.tags ? p.tags.split(',').map(t => t.trim()) : [])
    )).sort();

    useEffect(() => {
        if (selectedImage) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            // Also reset related modal states when closing
            setCopyFeedback(null);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedImage]);

    useEffect(() => {
        // When dependencies change, reset to page 1 and clear prompts
        setPage(1);
        setPrompts([]);
        fetchPrompts(undefined, undefined, 1, false);
    }, [refreshTrigger, searchQuery, useSemanticSearch, showFavoritesOnly, selectedTags]);

    // Scroll listener for sticky header effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchPrompts = async (overrideSearch?: string, useSemantic?: boolean, pageNum: number = 1, append: boolean = false) => {
        try {
            if (append) {
                setIsLoadingMore(true);
            } else {
                setLoading(true);
            }

            const isSemantic = useSemantic !== undefined ? useSemantic : useSemanticSearch;
            const query = overrideSearch !== undefined ? overrideSearch : searchQuery;

            let url = "/api/prompts";
            const params = new URLSearchParams();

            // Add pagination parameters
            params.append("page", pageNum.toString());
            params.append("limit", "20");

            if (query) {
                params.append("search", query);
                if (isSemantic) {
                    params.append("semantic", "true");
                    const key = localStorage.getItem("geminiApiKey");
                    if (key) params.append("apiKey", key);
                }
            }

            url += "?" + params.toString();

            const res = await fetch(url);
            const data = await res.json();

            // Handle new API response format with pagination metadata
            const newPrompts = data.prompts || [];
            const pagination = data.pagination;

            if (append) {
                setPrompts(prev => [...prev, ...newPrompts]);
            } else {
                setPrompts(newPrompts);
            }

            // Update pagination state
            if (pagination) {
                setTotalCount(pagination.total);
                setHasMore(pagination.hasMore);
            } else {
                // Fallback: assume no more data if less than 20 items
                setHasMore(newPrompts.length >= 20);
                if (!append) setTotalCount(newPrompts.length);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setIsLoadingMore(false);
        }
    };

    // Load more function for infinite scroll
    const loadMore = () => {
        if (!hasMore || isLoadingMore || loading) return;
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPrompts(undefined, undefined, nextPage, true);
    };

    // IntersectionObserver for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && !loading) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMore, isLoadingMore, loading, page]);

    const handleReindex = async () => {
        const apiKey = localStorage.getItem('geminiApiKey');
        if (!apiKey) {
            alert("請先在設定中輸入 Gemini API Key");
            return;
        }
        if (!confirm("確定要為所有圖片建立語義索引嗎？\n這將使用您的 Gemini API Quota，並可能需要幾分鐘時間。")) return;

        setLoading(true);
        let count = 0;
        try {
            // Process sequentially to avoid rate limits
            for (const p of prompts) {
                try {
                    const res = await fetch('/api/embeddings/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: p.id, apiKey })
                    });
                    if (res.ok) count++;
                } catch (e) {
                    console.error(`Failed to index ${p.id}`, e);
                }
            }
            alert(`索引重建完成！成功處理: ${count}/${prompts.length}`);
        } catch (e) {
            alert("索引過程中發生錯誤");
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

    const handleReuse = (image: PromptEntry) => {
        if (onReuse) {
            // 記錄當前滾動位置，防止頁面因 Modal 關閉而出現劇烈跳轉
            const currentScrollY = window.scrollY;

            const reuseText = image.originalPrompt || image.prompt;
            onReuse({ ...image, prompt: reuseText });
            setSelectedImage(null);

            // 確保狀態更新與 DOM 渲染完成後再執行滾動
            setTimeout(() => {
                const promptSection = document.getElementById('prompt-form-section');
                if (promptSection) {
                    promptSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    // 如果找不到錨點，則恢復原位，避免自動跳到頂部
                    window.scrollTo({ top: currentScrollY, behavior: 'smooth' });
                }
            }, 100);
        }
    };

    const handleCopyPrompt = async (text: string) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                textArea.style.top = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand("copy");
                textArea.remove();
            }
            setCopyFeedback("已複製到剪貼簿！");
            setTimeout(() => setCopyFeedback(null), 2000);
        } catch (err) {
            console.error("Failed to copy", err);
        }
    };

    const handleTagSync = (id: string, newTags: string) => {
        setPrompts(prev => prev.map(p => p.id === id ? { ...p, tags: newTags } : p));
    };

    const filteredPrompts = prompts.filter((p) => {
        // If using semantic search and we have a query, skip local keyword filtering
        // (Trust the backend results which are already sorted by similarity)
        if (useSemanticSearch && searchQuery) {
            const matchesFav = showFavoritesOnly ? p.isFavorite : true;
            // Still allow tag filtering on top of semantic results
            const itemTags = p.tags ? p.tags.split(',').map(t => t.trim()) : [];
            const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => itemTags.includes(tag));
            return matchesFav && matchesTags;
        }

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

    // Handle Style Fusion with mode and ratio
    const handleStyleFusion = async (mode: "themeA" | "themeB" | "auto", ratio: number) => {
        if (!fusionDialogData) return;
        const { imageA, imageB } = fusionDialogData;

        setFusionLoading(true);
        setFusionDialogData(null);

        let customInstruction = "";
        let basePrompt = "";

        if (mode === "themeA") {
            basePrompt = imageA.prompt;
            customInstruction = `Keep the MAIN SUBJECT from the first prompt ("${imageA.prompt}") as the primary focus (${ratio}% emphasis). 
Apply the VISUAL STYLE, colors, mood, and artistic elements from this second prompt: "${imageB.prompt}" (${100 - ratio}% influence).
The result should look like the subject from the first image, rendered in the style of the second.
Create a cohesive, detailed prompt that combines these elements.`;
        } else if (mode === "themeB") {
            basePrompt = imageB.prompt;
            customInstruction = `Keep the MAIN SUBJECT from this prompt ("${imageB.prompt}") as the primary focus (${ratio}% emphasis).
Apply the VISUAL STYLE, colors, mood, and artistic elements from this second prompt: "${imageA.prompt}" (${100 - ratio}% influence).
The result should look like the subject from the first prompt, rendered in the style of the second.
Create a cohesive, detailed prompt that combines these elements.`;
        } else {
            // Auto mode
            basePrompt = imageA.prompt;
            customInstruction = `Creatively merge these two prompts into one cohesive, enhanced prompt:
Prompt A: "${imageA.prompt}"
Prompt B: "${imageB.prompt}"
Combine the best visual elements, subjects, styles, colors, and moods from both. Be creative but coherent.`;
        }

        try {
            const res = await fetch('/api/variation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: basePrompt,
                    variationType: 'custom',
                    customInstruction,
                    apiKey: localStorage.getItem('geminiApiKey') || ''
                }),
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            if (data.variation && onReuse) {
                onReuse({ prompt: data.variation });
                setTimeout(() => {
                    document.getElementById('prompt-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                setIsSelectionMode(false);
                setSelectedIds(new Set());
            }
        } catch (err) {
            alert('風格融合失敗');
        } finally {
            setFusionLoading(false);
        }
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
                                onClick={() => {
                                    const ids = Array.from(selectedIds);
                                    const imgA = prompts.find(p => p.id === ids[0]);
                                    const imgB = prompts.find(p => p.id === ids[1]);
                                    if (imgA?.imageUrl && imgB?.imageUrl) {
                                        setFusionDialogData({ imageA: imgA, imageB: imgB });
                                    }
                                }}
                                disabled={fusionLoading}
                                className="px-4 py-2 bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-500 hover:to-orange-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {fusionLoading ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        融合中...
                                    </>
                                ) : (
                                    <>🎨 風格融合</>
                                )}
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
            <GalleryToolbar
                viewMode={viewMode}
                setViewMode={setViewMode}
                filteredCount={prompts.length}
                totalCount={totalCount}
                selectedTagsCount={selectedTags.length}
                isSelectionMode={isSelectionMode}
                setIsSelectionMode={setIsSelectionMode}
                onClearSelection={() => setSelectedIds(new Set())}
                showFavoritesOnly={showFavoritesOnly}
                setShowFavoritesOnly={setShowFavoritesOnly}
                isTagMenuOpen={isTagMenuOpen}
                setIsTagMenuOpen={setIsTagMenuOpen}
                selectedTags={selectedTags}
                setSelectedTags={setSelectedTags}
                allTags={allTags}
                onToggleTag={toggleTag}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                useSemanticSearch={useSemanticSearch}
                setUseSemanticSearch={setUseSemanticSearch}
                onSearch={fetchPrompts}
                onReindex={handleReindex}
                onUploadImages={async (files) => {
                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                            try {
                                const base64 = reader.result as string;
                                const res = await fetch('/api/upload-image', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        imageBase64: base64,
                                        filename: file.name,
                                        tags: '上傳'
                                    })
                                });
                                if (!res.ok) throw new Error('上傳失敗');
                                fetchPrompts();
                            } catch (err: any) {
                                alert(err.message || '上傳失敗');
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                }}
                isScrolled={isScrolled}
            />
            {/* Masonry Grid */}
            {/* Content Area */}
            {viewMode === 'map' ? (
                <InspirationMap onSelect={(id) => {
                    const found = prompts.find(p => p.id === id);
                    if (found) {
                        setSelectedImage(found);
                    }
                }} />
            ) : (
                <div className="relative">
                    {/* Empty State */}
                    {!loading && filteredPrompts.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
                                <Search className="w-10 h-10 text-gray-500" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">找不到相關的提示詞</h3>
                            <p className="text-gray-400 mb-8 max-w-xs text-center">試著調整標籤、切換語義搜尋，或是清除搜尋條件以查看更多內容。</p>
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setSelectedTags([]);
                                    setShowFavoritesOnly(false);
                                    setUseSemanticSearch(false);
                                }}
                                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/10 transition-all flex items-center gap-2 font-medium"
                            >
                                <Trash2 className="w-4 h-4" />
                                清除所有搜尋條件
                            </button>
                        </div>
                    )}

                    {/* Masonry Grid */}
                    {filteredPrompts.length > 0 && (
                        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6 pb-20">
                            {filteredPrompts.map((item) => (
                                <PromptCard
                                    key={item.id}
                                    item={item}
                                    isSelectionMode={isSelectionMode}
                                    isSelected={selectedIds.has(item.id)}
                                    onToggleSelection={toggleSelection}
                                    onSelect={setSelectedImage}
                                    onToggleFavorite={toggleFavorite}
                                    onDelete={handleDelete}
                                    handleSetAsReference={onSetAsReference}
                                />
                            ))}
                        </div>
                    )}

                    {/* Loading/Infinite Scroll Indicator at the end of the grid */}
                    <div ref={observerTarget} className="h-20 w-full flex items-center justify-center">
                        {isLoadingMore && (
                            <div className="flex items-center gap-2 text-gray-400">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm">載入更多圖片...</span>
                            </div>
                        )}
                        {!hasMore && filteredPrompts.length > 0 && !loading && (
                            <div className="py-10 text-center">
                                <span className="text-gray-500 text-sm bg-white/5 px-4 py-2 rounded-full border border-white/10">✨ 已顯示所有圖片 (共 {totalCount} 筆)</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Lightbox Modal */}
            {selectedImage && (
                <ImageModal
                    selectedImage={selectedImage}
                    onClose={() => setSelectedImage(null)}
                    toggleFavorite={toggleFavorite}
                    handleReuse={handleReuse}
                    handleDelete={handleDelete}
                    onTagUpdate={handleTagSync}
                    onPromptUpdate={(id, prompt, promptZh) => {
                        setPrompts(prev => prev.map(p => p.id === id ? { ...p, prompt, promptZh } : p));
                    }}
                    handleCopyPrompt={handleCopyPrompt}
                    copyFeedback={copyFeedback}
                    handleSetAsReference={(image) => {
                        onSetAsReference?.(image);
                        setSelectedImage(null);
                    }}
                />
            )}

            {/* A/B Comparison Modal */}
            {
                compareImages && (
                    <ABCompare
                        imageA={compareImages.a}
                        imageB={compareImages.b}
                        labelA="圖片 A"
                        labelB="圖片 B"
                        onClose={() => setCompareImages(null)}
                    />
                )
            }

            {/* Style Fusion Dialog */}
            {
                fusionDialogData && (
                    <StyleFusionDialog
                        imageA={{
                            id: fusionDialogData.imageA.id,
                            imageUrl: fusionDialogData.imageA.imageUrl || "",
                            prompt: fusionDialogData.imageA.prompt,
                            promptZh: fusionDialogData.imageA.promptZh,
                        }}
                        imageB={{
                            id: fusionDialogData.imageB.id,
                            imageUrl: fusionDialogData.imageB.imageUrl || "",
                            prompt: fusionDialogData.imageB.prompt,
                            promptZh: fusionDialogData.imageB.promptZh,
                        }}
                        onConfirm={handleStyleFusion}
                        onClose={() => setFusionDialogData(null)}
                    />
                )
            }


            {/* Image Editor */}
            {
                editorImage && (
                    <ImageEditor
                        isOpen={!!editorImage}
                        onClose={() => setEditorImage(null)}
                        initialImageUrl={editorImage}
                    />
                )
            }
        </div>
    );
}

