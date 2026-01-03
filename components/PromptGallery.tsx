"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import ABCompare from "./ABCompare";
import StyleFusionDialog from "./StyleFusionDialog";


import ImageEditor from "./ImageEditor";
import GalleryToolbar from "./GalleryToolbar";
import { ImageModal } from "./ImageModal";
import { PromptCard, PromptEntry } from "./PromptCard";
import {
    Search, Trash2, Loader2, Download, Zap, X, RefreshCw, Upload, Edit, MoreHorizontal, FolderPlus
} from "lucide-react";
import { Masonry } from "masonic";


interface PromptGalleryProps {
    refreshTrigger: number;
    onReuse?: (data: any) => void;
    onSetAsReference?: (image: any) => void;
}

import CollectionSidebar from "./collections/CollectionSidebar";
import CollectionSelector from "./collections/CollectionSelector";

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


    const [useSemanticSearch, setUseSemanticSearch] = useState(false);

    // Infinite Scroll Pagination State
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);
    const [localRefresh, setLocalRefresh] = useState(0);

    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    // Scroll state for sticky header
    const [isScrolled, setIsScrolled] = useState(false);

    // Collections
    const [isCollectionSidebarOpen, setIsCollectionSidebarOpen] = useState(false);
    const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
    const [showCollectionSelector, setShowCollectionSelector] = useState(false);
    const [masonryKey, setMasonryKey] = useState(0); // Force reset Masonry on full reload
    const [collectionRefreshTrigger, setCollectionRefreshTrigger] = useState(0);

    // Set Collection Cover Image
    const handleSetAsCover = async (id: string, url: string) => {
        if (!activeCollectionId) return;
        try {
            const res = await fetch(`/api/collections/${activeCollectionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coverImage: url })
            });

            if (res.ok) {
                // Trigger sidebar refresh to show new cover
                setCollectionRefreshTrigger(prev => prev + 1);

                // Show toast (simple alert for now)
                const toast = document.createElement("div");
                toast.className = "fixed bottom-10 right-10 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-xl z-[100] animate-in fade-in slide-in-from-bottom-2";
                toast.innerText = `已設為封面！`;
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 2000);
            }
        } catch (error) {
            console.error(error);
            alert('設定封面失敗');
        }
    };

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
    }, [refreshTrigger, searchQuery, useSemanticSearch, showFavoritesOnly, selectedTags, activeCollectionId, localRefresh]);

    // Scroll listener for sticky header effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Force layout refresh when sidebar toggles (to fix Masonry width)
    useEffect(() => {
        const timer = setTimeout(() => {
            // Force Masonry to completely re-calculate layout by updating its key
            // This is necessary because CSS transitions change the container width
            setMasonryKey(prev => prev + 1);
        }, 350); // Wait slightly longer than transition (300ms) to ensure final width is ready
        return () => clearTimeout(timer);
    }, [isCollectionSidebarOpen]);

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

            if (activeCollectionId) {
                params.append("collectionId", activeCollectionId);
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
                // Force Masonry to remount/reset its internal cache when the list is completely replaced.
                // This prevents "No data found at index" errors when the list shrinks.
                setMasonryKey(prev => prev + 1);
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

    // Filter prompts based on search, tags, favorites, and COLLECTIONS
    const filteredPrompts = useMemo(() => {
        return prompts.filter(p => {
            // If using semantic search and we have a query, skip local keyword filtering
            // (Trust the backend results which are already sorted by similarity)
            if (useSemanticSearch && searchQuery) {
                const matchesFav = showFavoritesOnly ? p.isFavorite : true;
                // Still allow tag filtering on top of semantic results
                const itemTags = p.tags ? p.tags.split(',').map(t => t.trim()) : [];
                const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => itemTags.includes(tag));

                return matchesFav && matchesTags;
            }

            const matchesSearch = (p.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.promptZh && p.promptZh.includes(searchQuery)));
            const matchesTags = selectedTags.length === 0 || selectedTags.every(t => p.tags?.includes(t));
            const matchesFavorite = !showFavoritesOnly || p.isFavorite;

            // Collection Filter - Handled by API
            // const matchesCollection = !activeCollectionId || (p.collections && p.collections.some((c: any) => c.id === activeCollectionId));

            return matchesSearch && matchesTags && matchesFavorite;
        });
    }, [prompts, searchQuery, selectedTags, showFavoritesOnly, activeCollectionId, useSemanticSearch]);

    // Masonry Stability Logic: Force reset synchronously if list shrinks (Filter/Delete)
    // accessible before render to avoid "No data at index" error
    const masonryGenRef = useRef(0);
    const prevCountRef = useRef(filteredPrompts.length);

    // If length decreases, we MUST generate a new key immediately for this render cycle
    if (filteredPrompts.length < prevCountRef.current) {
        masonryGenRef.current++;
    }
    // If length increases significantly (not just append), we might also want to reset?
    // For now, rely on shrinkage check which is the crash cause.
    prevCountRef.current = filteredPrompts.length;

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

    // Masonry Card Renderer - defined inside to access handlers
    // Using useCallback to prevent unnecessary remounts, dependent on selection state
    const MasonryCard = useCallback(({ data, width }: { data: PromptEntry, width: number }) => (
        <div className="mb-6">
            <PromptCard
                item={data}
                // width={width} // PromptCard internally manages width/aspect, but we pass current width if needed optimization? promptCard uses data.width.
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.has(data.id)}
                onToggleSelection={toggleSelection}
                onSelect={setSelectedImage}
                onToggleFavorite={toggleFavorite}
                onDelete={handleDelete}
                handleSetAsReference={onSetAsReference}
                onTagClick={toggleTag}
                onSetAsCover={activeCollectionId ? handleSetAsCover : undefined}
            />
        </div>
    ), [isSelectionMode, selectedIds, toggleSelection, setSelectedImage, toggleFavorite, handleDelete, onSetAsReference, toggleTag, activeCollectionId]);

    if (loading) return <div className="text-center p-10 opacity-50">載入畫廊中...</div>;

    return (

        <div className={`w-full max-w-[1600px] mx-auto px-4 space-y-8 transition-all duration-300 ease-in-out ${isCollectionSidebarOpen ? 'pl-72' : ''}`}>
            <CollectionSidebar
                isOpen={isCollectionSidebarOpen}
                onClose={() => setIsCollectionSidebarOpen(false)}
                activeCollectionId={activeCollectionId}
                onSelectCollection={(id) => {
                    setActiveCollectionId(id);
                }}
                refreshTrigger={collectionRefreshTrigger}
            />

            {/* Batch Action Bar */}
            {isSelectionMode && (
                <div className="flex items-center justify-between p-4 bg-slate-800/80 border-l-4 border-purple-500 rounded-xl backdrop-blur-sm animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleSelectAll}
                            className="text-sm text-purple-300 hover:text-white transition-colors"
                        >
                            {selectedIds.size === filteredPrompts.length ? "取消全選" : "全選"}
                        </button>
                        <span className="text-sm text-gray-300">
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

                        <button
                            onClick={() => setShowCollectionSelector(true)}
                            className="p-2 bg-purple-600/80 text-white rounded-full hover:bg-purple-600 transition-colors shadow-lg backdrop-blur-sm flex items-center gap-2 px-4"
                            title="加入收藏集"
                        >
                            <FolderPlus size={20} />
                            <span className="text-sm font-medium">加入收藏</span>
                        </button>

                        {/* Export Button */}
                        <button
                            onClick={async () => {
                                const selectedPrompts = prompts.filter(p => selectedIds.has(p.id));
                                if (selectedPrompts.length === 0) return;

                                // Create export data
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
                                a.download = `prompts_export_${new Date().toISOString().slice(0, 10)}.json`;
                                a.click();
                            }}
                            className="p-2 bg-blue-600/80 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg backdrop-blur-sm flex items-center gap-2 px-4"
                            title="匯出 JSON"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span className="text-sm font-medium">匯出</span>
                        </button>

                        {/* AI Auto-Tag */}
                        <button
                            onClick={async () => {
                                const ids = Array.from(selectedIds);
                                if (ids.length === 0) return;

                                const confirmTag = confirm(`確定要使用 AI 為這 ${ids.length} 張圖片自動產生標籤嗎？`);
                                if (!confirmTag) return;

                                try {
                                    // Show loading feedback
                                    const toast = document.createElement("div");
                                    toast.id = "tag-toast";
                                    toast.className = "fixed bottom-10 right-10 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-xl z-[100] animate-in fade-in slide-in-from-bottom-2";
                                    toast.innerText = `AI 分析中 (${ids.length} 張)...`;
                                    document.body.appendChild(toast);

                                    const res = await fetch('/api/tags/auto-tag', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ promptIds: ids })
                                    });

                                    const data = await res.json();

                                    // Remove loading toast
                                    document.getElementById("tag-toast")?.remove();

                                    if (data.success) {
                                        // Show success toast
                                        const successToast = document.createElement("div");
                                        successToast.className = "fixed bottom-10 right-10 bg-green-600 text-white px-4 py-2 rounded-lg shadow-xl z-[100] animate-in fade-in slide-in-from-bottom-2";
                                        successToast.innerText = `成功為 ${data.successCount} 張圖片加上標籤！`;
                                        document.body.appendChild(successToast);
                                        setTimeout(() => successToast.remove(), 3000);

                                        // Refresh gallery
                                        setLocalRefresh(prev => prev + 1);
                                        setIsSelectionMode(false);
                                        setSelectedIds(new Set());
                                    } else {
                                        alert('部分失敗: ' + (data.error || '不明錯誤'));
                                    }
                                } catch (e) {
                                    console.error(e);
                                    alert('AI Tagging 發生錯誤');
                                    document.getElementById("tag-toast")?.remove();
                                }
                            }}
                            className="p-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full hover:shadow-lg hover:shadow-purple-500/30 transition-all shadow-lg backdrop-blur-sm flex items-center gap-2 px-4 border border-white/20"
                            title="AI 自動標籤"
                        >
                            <span className="text-lg">🪄</span>
                            <span className="text-sm font-bold">AI Tag</span>
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
            )
            }

            {/* Toolbar */}
            < GalleryToolbar
                filteredCount={prompts.length}
                totalCount={totalCount}
                selectedTagsCount={selectedTags.length}
                isSelectionMode={isSelectionMode}
                setIsSelectionMode={setIsSelectionMode}
                onClearSelection={() => setSelectedIds(new Set())
                }
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
                onToggleSidebar={() => setIsCollectionSidebarOpen(prev => !prev)}
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
            {
                (

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
                        {/* Masonry Grid (Virtualized) */}
                        {filteredPrompts.length > 0 && (
                            <div className="min-h-screen pb-20">
                                <Masonry
                                    key={`${masonryKey}-${masonryGenRef.current}`}
                                    items={filteredPrompts}
                                    columnGutter={12}
                                    columnWidth={280}
                                    overscanBy={2}
                                    render={MasonryCard}
                                />
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
                )
            }

            {/* Lightbox Modal */}
            {
                selectedImage && (
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
                            setSelectedImage(null);
                        }}
                        onTagClick={(tag) => {
                            setSelectedImage(null);
                            toggleTag(tag);
                        }}
                    />
                )
            }

            {/* Collection Selector Modal */}
            {showCollectionSelector && (
                <CollectionSelector
                    promptIds={Array.from(selectedIds)}
                    onClose={() => setShowCollectionSelector(false)}
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
        </div >
    );
}

