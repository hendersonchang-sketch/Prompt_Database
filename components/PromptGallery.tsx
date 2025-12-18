"use client";

import { useEffect, useState, useRef } from "react";
import ABCompare from "./ABCompare";
import StyleFusionDialog from "./StyleFusionDialog";
import SocialPreview from "./SocialPreview";

import InspirationMap from "./InspirationMap";
import ImageEditor from "./ImageEditor";
import GalleryToolbar from "./GalleryToolbar";

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

    // Style Fusion Dialog State
    const [fusionDialogData, setFusionDialogData] = useState<{
        imageA: PromptEntry;
        imageB: PromptEntry;
    } | null>(null);
    const [fusionLoading, setFusionLoading] = useState(false);

    // Structured JSON Analysis State
    const [structuredJson, setStructuredJson] = useState<any>(null);
    const [structuredLoading, setStructuredLoading] = useState(false);

    // Deep Image Analysis State
    const [deepAnalysis, setDeepAnalysis] = useState<any>(null);
    const [deepAnalysisLoading, setDeepAnalysisLoading] = useState(false);

    // AI Art Director & Regional Tagging
    const [compositionAnalysis, setCompositionAnalysis] = useState<any>(null);
    const [compositionLoading, setCompositionLoading] = useState(false);
    const [isDetectiveMode, setIsDetectiveMode] = useState(false);
    const [detections, setDetections] = useState<any[]>([]);
    const [detectingLoading, setDetectingLoading] = useState(false);
    const [hoveredObject, setHoveredObject] = useState<string | null>(null);

    // Smart Crop State
    const [smartCropData, setSmartCropData] = useState<any>(null);
    const [smartCropLoading, setSmartCropLoading] = useState(false);
    const [selectedCrop, setSelectedCrop] = useState<number | null>(null);

    // Reverse Prompt Result State
    const [reversePromptResult, setReversePromptResult] = useState<string | null>(null);

    // Comprehensive Evaluation State
    const [comprehensiveEval, setComprehensiveEval] = useState<any>(null);
    const [comprehensiveLoading, setComprehensiveLoading] = useState(false);
    const [showEvalModal, setShowEvalModal] = useState(false);
    const [showSocialPreview, setShowSocialPreview] = useState(false);
    const [editorImage, setEditorImage] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'gallery' | 'map'>('gallery');

    const [useSemanticSearch, setUseSemanticSearch] = useState(false);

    // Infinite Scroll Pagination State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Scroll state for sticky header
    const [isScrolled, setIsScrolled] = useState(false);

    // Extract Unique Tags
    const allTags = Array.from(new Set(
        prompts.flatMap(p => p.tags ? p.tags.split(',').map(t => t.trim()) : [])
    )).sort();

    useEffect(() => {
        fetchPrompts();
    }, [refreshTrigger]);

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

            if (isSemantic && query) {
                params.append("search", query);
                params.append("semantic", "true");
                const key = localStorage.getItem("geminiApiKey");
                if (key) params.append("apiKey", key);
            }

            url += "?" + params.toString();

            const res = await fetch(url);
            const data = await res.json();

            // Handle new API response format with pagination metadata
            const newPrompts = data.prompts || data; // Support both old and new format
            const pagination = data.pagination;

            if (append) {
                setPrompts(prev => [...prev, ...newPrompts]);
            } else {
                setPrompts(newPrompts);
            }

            // Update pagination state
            if (pagination) {
                setHasMore(pagination.hasMore);
            } else {
                // Fallback: assume no more data if less than 20 items
                setHasMore(newPrompts.length >= 20);
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
            // Try modern clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for non-HTTPS or unsupported browsers
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
            alert("已複製到剪貼簿！");
        } catch (err) {
            console.error("Failed to copy", err);
            alert("複製失敗，請手動選取複製");
        }
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
                window.scrollTo({ top: 0, behavior: 'smooth' });
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
                filteredCount={filteredPrompts.length}
                totalCount={prompts.length}
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
                onImport={async (file) => {
                    try {
                        const text = await file.text();
                        const res = await fetch('/api/import', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: text,
                        });
                        if (!res.ok) throw new Error(await res.text());
                        const result = await res.json();
                        alert(`匯入完成！\n成功: ${result.imported}\n跳過: ${result.skipped}\n總計: ${result.total}`);
                        window.location.reload();
                    } catch (err: any) {
                        alert('匯入失敗: ' + (err.message || '未知錯誤'));
                    }
                }}
                onExportJSON={async () => {
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
                onExportZIP={async () => {
                    const btn = document.getElementById('zip-export-btn-toolbar') as HTMLButtonElement;
                    if (btn) btn.disabled = true;
                    try {
                        const res = await fetch('/api/backup-zip');
                        if (!res.ok) throw new Error('ZIP 匯出失敗');
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `prompt-database-full-backup-${Date.now()}.zip`;
                        a.click();
                        URL.revokeObjectURL(url);
                        alert('ZIP 匯出完成！');
                    } catch (err) {
                        alert('ZIP 匯出失敗');
                    } finally {
                        if (btn) btn.disabled = false;
                    }
                }}
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
                    ))
                    }
                </div>
            )}

            {/* Infinite Scroll Loading Indicator */}
            {viewMode !== 'map' && isLoadingMore && (
                <div className="flex justify-center items-center py-8">
                    <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                    <span className="ml-3 text-gray-400 text-sm">載入更多圖片...</span>
                </div>
            )}

            {/* IntersectionObserver Target */}
            {viewMode !== 'map' && hasMore && !loading && (
                <div ref={observerTarget} className="h-4" />
            )}

            {filteredPrompts.length === 0 && viewMode !== 'map' && (
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
                            <div className="relative w-full md:w-auto max-h-[50vh] md:max-h-[75vh] mb-4 md:mb-6 group/img">
                                <img
                                    src={selectedImage.imageUrl || ""}
                                    alt={selectedImage.prompt}
                                    className="w-full h-full object-contain rounded-lg shadow-2xl"
                                />

                                {/* Detective Mode Overlay */}
                                {isDetectiveMode && detections.length > 0 && (
                                    <div className="absolute inset-0 pointer-events-none">
                                        {detections.map((obj, idx) => (
                                            <div
                                                key={idx}
                                                className="absolute border-2 border-cyan-400 bg-cyan-400/10 pointer-events-auto cursor-help transition-all hover:bg-cyan-400/30 group/box"
                                                style={{
                                                    top: `${obj.box_2d[0] / 10}%`,
                                                    left: `${obj.box_2d[1] / 10}%`,
                                                    height: `${(obj.box_2d[2] - obj.box_2d[0]) / 10}%`,
                                                    width: `${(obj.box_2d[3] - obj.box_2d[1]) / 10}%`,
                                                }}
                                                onMouseEnter={() => setHoveredObject(obj.label_zh || obj.label)}
                                                onMouseLeave={() => setHoveredObject(null)}
                                            >
                                                <div className="absolute top-0 left-0 bg-cyan-500 text-white text-[10px] px-1 py-0.5 -translate-y-full opacity-0 group-hover/box:opacity-100 transition-opacity whitespace-nowrap z-30">
                                                    {obj.label_zh || obj.label}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Composition Focal Points Overlay */}
                                {compositionAnalysis && compositionAnalysis.focal_points && (
                                    <div className="absolute inset-0 pointer-events-none">
                                        {compositionAnalysis.focal_points.map((fp: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="absolute w-4 h-4 -ml-2 -mt-2 bg-indigo-500 border-2 border-white rounded-full shadow-lg shadow-indigo-500/50 flex items-center justify-center animate-pulse z-20"
                                                style={{
                                                    top: `${fp.coordinates[0] / 10}%`,
                                                    left: `${fp.coordinates[1] / 10}%`,
                                                }}
                                            >
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap">
                                                    {fp.label}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Smart Crop Overlay */}
                                {smartCropData && smartCropData.crops && selectedCrop !== null && (
                                    <div className="absolute inset-0 pointer-events-none">
                                        {/* Darkened area outside crop */}
                                        <div className="absolute inset-0 bg-black/50" />

                                        {/* Highlighted crop region */}
                                        {(() => {
                                            const crop = smartCropData.crops[selectedCrop];
                                            if (!crop?.region) return null;
                                            const [ymin, xmin, ymax, xmax] = crop.region;
                                            return (
                                                <div
                                                    className="absolute border-2 border-emerald-400 bg-transparent shadow-lg"
                                                    style={{
                                                        top: `${ymin / 10}%`,
                                                        left: `${xmin / 10}%`,
                                                        height: `${(ymax - ymin) / 10}%`,
                                                        width: `${(xmax - xmin) / 10}%`,
                                                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
                                                    }}
                                                >
                                                    {/* Crop label */}
                                                    <div className="absolute -top-7 left-0 bg-emerald-500 text-white text-xs px-2 py-1 rounded-t font-medium">
                                                        {crop.name} ({crop.ratio})
                                                    </div>
                                                    {/* Rule of thirds grid */}
                                                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                                                        {[...Array(9)].map((_, i) => (
                                                            <div key={i} className="border border-white/20" />
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* Hover Label for Detective Mode */}
                                {hoveredObject && (
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-cyan-500/50 text-cyan-400 text-sm font-bold animate-in fade-in zoom-in-95 z-40">
                                        🔍 偵測到：{hoveredObject}
                                    </div>
                                )}

                                {/* Detecting Loading Overlay */}
                                {detectingLoading && (
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center rounded-lg z-50">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                                            <span className="text-cyan-400 font-bold text-sm">偵探模式掃描中...</span>
                                        </div>
                                    </div>
                                )}

                                {/* Composition Loading Overlay */}
                                {compositionLoading && !compositionAnalysis && (
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center rounded-lg z-50">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                            <span className="text-indigo-400 font-bold text-sm">構圖分析中...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

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
                                                            type="button"
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
                                                        type="button"
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


                                            {/* Structured JSON Analysis Result */}
                                            {structuredJson && (
                                                <div className="pt-3 border-t border-white/10">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <p className="text-xs text-cyan-400">📊 結構化 Prompt 分析</p>
                                                        <button
                                                            onClick={() => handleCopyPrompt(JSON.stringify(structuredJson, null, 2))}
                                                            className="text-[10px] text-gray-500 hover:text-white transition-colors"
                                                        >
                                                            複製 JSON
                                                        </button>
                                                    </div>
                                                    <pre className="bg-black/60 rounded-lg p-3 text-[10px] text-cyan-300 font-mono overflow-x-auto max-h-64 overflow-y-auto select-text">
                                                        {JSON.stringify(structuredJson, null, 2)}
                                                    </pre>
                                                </div>
                                            )}

                                            {/* Deep Image Analysis Result */}
                                            {deepAnalysis && (
                                                <div className="pt-3 border-t border-white/10 space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-xs text-violet-400 font-medium">🔬 深度圖片分析</p>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setDeepAnalysis(null)}
                                                                className="text-[10px] text-gray-500 hover:text-red-400 transition-colors"
                                                            >
                                                                關閉
                                                            </button>
                                                            <button
                                                                onClick={() => handleCopyPrompt(JSON.stringify(deepAnalysis, null, 2))}
                                                                className="text-[10px] text-gray-500 hover:text-white transition-colors"
                                                            >
                                                                複製 JSON
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {deepAnalysis.error ? (
                                                        <p className="text-red-400 text-xs">{deepAnalysis.error}</p>
                                                    ) : (
                                                        <div className="space-y-2 text-xs">
                                                            {/* Quality Score with Progress Bars */}
                                                            {deepAnalysis.qualityScore && (
                                                                <div className="p-3 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-lg">
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <span className="text-3xl font-bold text-violet-300">{deepAnalysis.qualityScore.overall}</span>
                                                                        <div className="flex-1">
                                                                            <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                                                                <div className="h-full bg-gradient-to-r from-violet-500 to-purple-400" style={{ width: `${deepAnalysis.qualityScore.overall * 10}%` }}></div>
                                                                            </div>
                                                                            <p className="text-gray-400 text-[10px] mt-1">{deepAnalysis.qualityScore.comment}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-4 gap-2 text-[9px]">
                                                                        {['composition', 'clarity', 'creativity', 'technicalQuality'].map((key) => (
                                                                            <div key={key} className="text-center">
                                                                                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden mb-1">
                                                                                    <div className="h-full bg-purple-400" style={{ width: `${(deepAnalysis.qualityScore[key] || 0) * 10}%` }}></div>
                                                                                </div>
                                                                                <span className="text-gray-500">{key === 'technicalQuality' ? '技術' : key === 'composition' ? '構圖' : key === 'clarity' ? '清晰' : '創意'}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Style with Action Buttons */}
                                                            {deepAnalysis.style && (
                                                                <details className="group" open>
                                                                    <summary className="p-2 bg-white/5 rounded-lg cursor-pointer list-none">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-pink-400 font-medium">🎨 風格識別</span>
                                                                            <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                                        </div>
                                                                    </summary>
                                                                    <div className="p-2 pt-0">
                                                                        <p className="text-gray-300"><span className="text-gray-500">風格：</span>{deepAnalysis.style.artStyle}</p>
                                                                        <p className="text-gray-300"><span className="text-gray-500">氛圍：</span>{deepAnalysis.style.mood}</p>
                                                                        <p className="text-gray-300"><span className="text-gray-500">光線：</span>{deepAnalysis.style.lighting}</p>
                                                                        {deepAnalysis.style.colorPalette && (
                                                                            <div className="flex items-center gap-1 mt-2">
                                                                                <span className="text-gray-500">配色：</span>
                                                                                {deepAnalysis.style.colorPalette.slice(0, 8).map((c: string, i: number) => (
                                                                                    <div
                                                                                        key={i}
                                                                                        onClick={() => { handleCopyPrompt(c); }}
                                                                                        className="w-5 h-5 rounded cursor-pointer hover:scale-125 transition-transform border border-white/20"
                                                                                        style={{ backgroundColor: c }}
                                                                                        title={`點擊複製 ${c}`}
                                                                                    ></div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                        {deepAnalysis.style.replicatePrompt && (
                                                                            <div className="mt-2 p-2 bg-black/40 rounded">
                                                                                <div className="flex justify-between items-center mb-1">
                                                                                    <span className="text-gray-500 text-[10px]">複製此風格 Prompt：</span>
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const event = new CustomEvent('loadPromptFromAnalysis', { detail: deepAnalysis.style.replicatePrompt });
                                                                                            window.dispatchEvent(event);
                                                                                            handleCopyPrompt(deepAnalysis.style.replicatePrompt);
                                                                                        }}
                                                                                        className="text-[9px] px-2 py-0.5 bg-pink-600/30 hover:bg-pink-600 text-pink-300 hover:text-white rounded transition-colors"
                                                                                    >
                                                                                        📋 複製
                                                                                    </button>
                                                                                </div>
                                                                                <p className="text-cyan-300 text-[10px] select-all mb-2">{deepAnalysis.style.replicatePrompt}</p>
                                                                                {/* Save to Image Button */}
                                                                                <button
                                                                                    onClick={async () => {
                                                                                        if (!selectedImage) return;
                                                                                        try {
                                                                                            // Translate to Chinese first
                                                                                            const translateRes = await fetch('/api/translate', {
                                                                                                method: 'POST',
                                                                                                headers: { 'Content-Type': 'application/json' },
                                                                                                body: JSON.stringify({
                                                                                                    text: deepAnalysis.style.replicatePrompt,
                                                                                                    targetLang: 'zh-TW',
                                                                                                    apiKey: localStorage.getItem('geminiApiKey') || ''
                                                                                                })
                                                                                            });
                                                                                            let promptZh = deepAnalysis.style.replicatePrompt;
                                                                                            if (translateRes.ok) {
                                                                                                const translateData = await translateRes.json();
                                                                                                promptZh = translateData.translated || promptZh;
                                                                                            }

                                                                                            const res = await fetch(`/api/prompts/${selectedImage.id}`, {
                                                                                                method: 'PATCH',
                                                                                                headers: { 'Content-Type': 'application/json' },
                                                                                                body: JSON.stringify({
                                                                                                    prompt: deepAnalysis.style.replicatePrompt,
                                                                                                    promptZh: promptZh,
                                                                                                    originalPrompt: promptZh
                                                                                                })
                                                                                            });
                                                                                            if (!res.ok) throw new Error('更新失敗');
                                                                                            setSelectedImage({
                                                                                                ...selectedImage, prompt: deepAnalysis.style.replicatePrompt, promptZh: promptZh,
                                                                                                originalPrompt: promptZh
                                                                                            });
                                                                                            fetchPrompts();
                                                                                            alert('✅ 已儲存英文+中文 Prompt！');
                                                                                        } catch (err: any) {
                                                                                            alert('儲存失敗：' + err.message);
                                                                                        }
                                                                                    }}
                                                                                    className="w-full text-[9px] py-1 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded transition-colors"
                                                                                >
                                                                                    💾 儲存為此圖的 Prompt（含中文翻譯）
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </details>
                                                            )}

                                                            {/* Composition */}
                                                            {deepAnalysis.composition && (
                                                                <details className="group">
                                                                    <summary className="p-2 bg-white/5 rounded-lg cursor-pointer list-none">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-amber-400 font-medium">📐 構圖分析</span>
                                                                            <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                                        </div>
                                                                    </summary>
                                                                    <div className="p-2 pt-0">
                                                                        <p className="text-gray-300"><span className="text-gray-500">類型：</span>{deepAnalysis.composition.type}</p>
                                                                        <p className="text-gray-300"><span className="text-gray-500">焦點：</span>{deepAnalysis.composition.focusPoint}</p>
                                                                        <p className="text-gray-300"><span className="text-gray-500">平衡：</span>{deepAnalysis.composition.balance}</p>
                                                                        {deepAnalysis.composition.elements && (
                                                                            <p className="text-gray-300"><span className="text-gray-500">元素：</span>{deepAnalysis.composition.elements.join('、')}</p>
                                                                        )}
                                                                        {deepAnalysis.composition.suggestion && (
                                                                            <p className="text-yellow-400 mt-1 p-1 bg-yellow-500/10 rounded">💡 {deepAnalysis.composition.suggestion}</p>
                                                                        )}
                                                                    </div>
                                                                </details>
                                                            )}

                                                            {/* Technical Specs */}
                                                            {deepAnalysis.technicalSpecs && (
                                                                <details className="group">
                                                                    <summary className="p-2 bg-white/5 rounded-lg cursor-pointer list-none">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-cyan-400 font-medium">⚙️ 技術規格</span>
                                                                            <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                                        </div>
                                                                    </summary>
                                                                    <div className="p-2 pt-0 grid grid-cols-2 gap-1 text-[10px]">
                                                                        <p><span className="text-gray-500">解析度：</span><span className="text-gray-300">{deepAnalysis.technicalSpecs.estimatedResolution}</span></p>
                                                                        <p><span className="text-gray-500">雜訊：</span><span className="text-gray-300">{deepAnalysis.technicalSpecs.noiseLevel}</span></p>
                                                                        <p><span className="text-gray-500">銳利度：</span><span className="text-gray-300">{deepAnalysis.technicalSpecs.sharpness}</span></p>
                                                                        <p><span className="text-gray-500">色彩：</span><span className="text-gray-300">{deepAnalysis.technicalSpecs.colorDepth}</span></p>
                                                                        <p><span className="text-gray-500">動態範圍：</span><span className="text-gray-300">{deepAnalysis.technicalSpecs.dynamicRange}</span></p>
                                                                    </div>
                                                                </details>
                                                            )}

                                                            {/* Commercial Value */}
                                                            {deepAnalysis.commercialValue && (
                                                                <details className="group">
                                                                    <summary className="p-2 bg-white/5 rounded-lg cursor-pointer list-none">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-emerald-400 font-medium">💰 商業價值</span>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-emerald-300 font-bold">{deepAnalysis.commercialValue.score}/10</span>
                                                                                <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                                            </div>
                                                                        </div>
                                                                    </summary>
                                                                    <div className="p-2 pt-0">
                                                                        <p className="text-gray-300"><span className="text-gray-500">目標受眾：</span>{deepAnalysis.commercialValue.targetAudience}</p>
                                                                        <p className="text-gray-300"><span className="text-gray-500">獨特性：</span>{deepAnalysis.commercialValue.uniqueness}</p>
                                                                        <p className="text-gray-300"><span className="text-gray-500">市場潛力：</span>{deepAnalysis.commercialValue.marketability}</p>
                                                                        {deepAnalysis.commercialValue.useCases && (
                                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                                {deepAnalysis.commercialValue.useCases.map((u: string, i: number) => (
                                                                                    <span key={i} className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[9px]">{u}</span>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </details>
                                                            )}

                                                            {/* Social Media with Copy Buttons */}
                                                            {deepAnalysis.socialMedia && (
                                                                <details className="group" open>
                                                                    <summary className="p-2 bg-white/5 rounded-lg cursor-pointer list-none">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-blue-400 font-medium">📱 社群文案</span>
                                                                            <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                                        </div>
                                                                    </summary>
                                                                    <div className="p-2 pt-0 space-y-2">
                                                                        <div className="flex justify-between items-start">
                                                                            <p className="text-white font-medium flex-1">{deepAnalysis.socialMedia.title}</p>
                                                                            <button
                                                                                onClick={() => handleCopyPrompt(deepAnalysis.socialMedia.title)}
                                                                                className="text-[9px] px-1.5 py-0.5 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded transition-colors"
                                                                            >複製</button>
                                                                        </div>
                                                                        <div className="flex justify-between items-start">
                                                                            <p className="text-gray-300 text-[10px] flex-1">{deepAnalysis.socialMedia.caption}</p>
                                                                            <button
                                                                                onClick={() => handleCopyPrompt(deepAnalysis.socialMedia.caption)}
                                                                                className="text-[9px] px-1.5 py-0.5 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded transition-colors ml-1"
                                                                            >複製</button>
                                                                        </div>
                                                                        {deepAnalysis.socialMedia.hashtags && (
                                                                            <div className="flex justify-between items-start">
                                                                                <p className="text-blue-300 text-[10px] flex-1">{deepAnalysis.socialMedia.hashtags.map((t: string) => `#${t}`).join(' ')}</p>
                                                                                <button
                                                                                    onClick={() => handleCopyPrompt(deepAnalysis.socialMedia.hashtags.map((t: string) => `#${t}`).join(' '))}
                                                                                    className="text-[9px] px-1.5 py-0.5 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded transition-colors ml-1"
                                                                                >複製</button>
                                                                            </div>
                                                                        )}
                                                                        <button
                                                                            onClick={() => handleCopyPrompt(`${deepAnalysis.socialMedia.title}\n\n${deepAnalysis.socialMedia.caption}\n\n${deepAnalysis.socialMedia.hashtags?.map((t: string) => `#${t}`).join(' ') || ''}`)}
                                                                            className="w-full text-[10px] py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded transition-colors"
                                                                        >📋 一鍵複製全部文案</button>
                                                                    </div>
                                                                </details>
                                                            )}

                                                            {/* Similar Templates */}
                                                            {deepAnalysis.similarTemplates && deepAnalysis.similarTemplates.length > 0 && (
                                                                <div className="p-2 bg-white/5 rounded-lg">
                                                                    <p className="text-purple-400 font-medium mb-1">🎯 推薦類似模板</p>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {deepAnalysis.similarTemplates.map((t: string, i: number) => (
                                                                            <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-[10px] cursor-pointer hover:bg-purple-500/40 transition-colors">{t}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* AI Art Director Analysis Result */}
                                                            {compositionAnalysis && (
                                                                <div className="pt-3 border-t border-white/10 space-y-3">
                                                                    <div className="flex justify-between items-center">
                                                                        <p className="text-xs text-indigo-400 font-medium">📐 構圖深度指導</p>
                                                                        <button
                                                                            onClick={() => setCompositionAnalysis(null)}
                                                                            className="text-[10px] text-gray-500 hover:text-red-400 transition-colors"
                                                                        >
                                                                            關閉
                                                                        </button>
                                                                    </div>

                                                                    <div className="space-y-3 text-xs">
                                                                        <div className="p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                                                            <p className="text-indigo-300 font-medium mb-1">⚖️ 畫面平衡評價</p>
                                                                            <p className="text-gray-300 leading-relaxed">{compositionAnalysis.balance_evaluation}</p>
                                                                        </div>

                                                                        <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                                                            <p className="text-amber-300 font-medium mb-1">💡 優化修飾建議</p>
                                                                            <p className="text-gray-300 leading-relaxed">{compositionAnalysis.prompt_suggestion}</p>
                                                                            <button
                                                                                onClick={() => {
                                                                                    handleCopyPrompt(compositionAnalysis.prompt_suggestion);
                                                                                    const event = new CustomEvent('loadPromptFromAnalysis', { detail: compositionAnalysis.prompt_suggestion });
                                                                                    window.dispatchEvent(event);
                                                                                }}
                                                                                className="mt-2 w-full py-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-200 hover:text-white rounded transition-all text-[10px]"
                                                                            >
                                                                                📋 複製並套用到實驗室
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Smart Crop Panel */}
                                                            {smartCropData && smartCropData.crops && (
                                                                <div className="pt-3 border-t border-white/10 space-y-3">
                                                                    <div className="flex justify-between items-center">
                                                                        <p className="text-xs text-emerald-400 font-medium">✂️ 智能裁切建議</p>
                                                                        <button
                                                                            onClick={() => {
                                                                                setSmartCropData(null);
                                                                                setSelectedCrop(null);
                                                                            }}
                                                                            className="text-[10px] text-gray-500 hover:text-red-400 transition-colors"
                                                                        >
                                                                            關閉
                                                                        </button>
                                                                    </div>

                                                                    {smartCropData.mainSubject && (
                                                                        <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-xs">
                                                                            <p className="text-emerald-300 font-medium">🎯 主體：{smartCropData.mainSubject.description}</p>
                                                                        </div>
                                                                    )}

                                                                    <div className="space-y-2">
                                                                        {smartCropData.crops.map((crop: any, idx: number) => (
                                                                            <button
                                                                                key={idx}
                                                                                onClick={() => setSelectedCrop(idx)}
                                                                                className={`w-full p-2 rounded-lg text-left text-xs transition-all ${selectedCrop === idx
                                                                                    ? 'bg-emerald-500/30 border border-emerald-400'
                                                                                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                                                                    }`}
                                                                            >
                                                                                <div className="flex justify-between items-center mb-1">
                                                                                    <span className={`font-medium ${selectedCrop === idx ? 'text-emerald-300' : 'text-gray-300'}`}>
                                                                                        {crop.name}
                                                                                    </span>
                                                                                    <span className="text-[10px] text-gray-500 bg-white/10 px-1.5 py-0.5 rounded">
                                                                                        {crop.ratio}
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-gray-400 text-[10px] leading-relaxed">{crop.reason}</p>
                                                                            </button>
                                                                        ))}
                                                                    </div>

                                                                    {smartCropData.compositionNotes && (
                                                                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-xs">
                                                                            <p className="text-blue-300 font-medium mb-1">📝 構圖建議</p>
                                                                            <p className="text-gray-400 text-[10px]">{smartCropData.compositionNotes}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {deepAnalysis.detailedTags && (
                                                                <details className="group">
                                                                    <summary className="p-2 bg-white/5 rounded-lg cursor-pointer list-none">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-green-400 font-medium">🏷️ 詳細標籤</span>
                                                                            <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                                        </div>
                                                                    </summary>
                                                                    <div className="p-2 pt-1">
                                                                        <div className="flex flex-wrap gap-1 mb-2">
                                                                            {Object.entries(deepAnalysis.detailedTags).map(([cat, tags]: [string, any]) => (
                                                                                (tags as string[]).map((tag: string, i: number) => (
                                                                                    <span
                                                                                        key={`${cat}-${i}`}
                                                                                        onClick={() => handleCopyPrompt(tag)}
                                                                                        className="px-1.5 py-0.5 bg-white/10 hover:bg-green-500/30 rounded text-[9px] text-gray-300 cursor-pointer transition-colors"
                                                                                        title="點擊複製"
                                                                                    >
                                                                                        {tag}
                                                                                    </span>
                                                                                ))
                                                                            ))}
                                                                        </div>
                                                                        {/* Update Tags Button */}
                                                                        <button
                                                                            onClick={async () => {
                                                                                if (!selectedImage) return;
                                                                                // Get important tags (first 2 from each category)
                                                                                const importantTags: string[] = [];
                                                                                const categories = ['subject', 'emotion', 'technique', 'scene'];
                                                                                for (const cat of categories) {
                                                                                    const tags = deepAnalysis.detailedTags[cat] as string[] | undefined;
                                                                                    if (tags && tags.length > 0) {
                                                                                        importantTags.push(...tags.slice(0, 2));
                                                                                    }
                                                                                }
                                                                                // Combine with existing tags
                                                                                const existingTags = selectedImage.tags ? selectedImage.tags.split(',').map(t => t.trim()) : [];
                                                                                const allTags = Array.from(new Set([...existingTags, ...importantTags])).slice(0, 10);
                                                                                const newTagsStr = allTags.join(', ');

                                                                                try {
                                                                                    const res = await fetch(`/api/prompts/${selectedImage.id}`, {
                                                                                        method: 'PATCH',
                                                                                        headers: { 'Content-Type': 'application/json' },
                                                                                        body: JSON.stringify({ tags: newTagsStr })
                                                                                    });
                                                                                    if (!res.ok) throw new Error('更新失敗');

                                                                                    // Update local state
                                                                                    setSelectedImage({ ...selectedImage, tags: newTagsStr });
                                                                                    fetchPrompts();
                                                                                    alert(`✅ 已加入標籤：${importantTags.join(', ')}`);
                                                                                } catch (err: any) {
                                                                                    alert('標籤更新失敗：' + err.message);
                                                                                }
                                                                            }}
                                                                            className="w-full text-[10px] py-1.5 bg-green-600/20 hover:bg-green-600 text-green-300 hover:text-white rounded transition-colors flex items-center justify-center gap-1"
                                                                        >
                                                                            ✅ 加入重要標籤到此圖片
                                                                        </button>
                                                                    </div>
                                                                </details>
                                                            )}

                                                            {/* Modifications */}
                                                            {deepAnalysis.modifications && deepAnalysis.modifications.length > 0 && (
                                                                <details className="group">
                                                                    <summary className="p-2 bg-white/5 rounded-lg cursor-pointer list-none">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-orange-400 font-medium">✏️ 局部修改建議 ({deepAnalysis.modifications.length})</span>
                                                                            <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                                        </div>
                                                                    </summary>
                                                                    <div className="p-2 pt-0">
                                                                        {deepAnalysis.modifications.map((m: any, i: number) => (
                                                                            <div key={i} className="mb-3 pb-3 border-b border-white/5 last:border-0 last:mb-0 last:pb-0">
                                                                                <p className="text-gray-300 text-[11px]"><span className="text-gray-500">📍 區域：</span>{m.area}</p>
                                                                                <p className="text-amber-400 text-[10px] mt-1"><span className="text-gray-500">⚠️ 大師評價：</span>{m.issue}</p>
                                                                                <div className="mt-2 p-2 bg-black/40 rounded">
                                                                                    <div className="flex justify-between items-center mb-1">
                                                                                        <span className="text-gray-500 text-[9px]">🎨 修改 Prompt（英文）：</span>
                                                                                        <button
                                                                                            onClick={() => handleCopyPrompt(m.prompt || m.instruction)}
                                                                                            className="text-[9px] px-2 py-0.5 bg-orange-600/30 hover:bg-orange-600 text-orange-300 hover:text-white rounded transition-colors"
                                                                                        >📋 複製 Prompt</button>
                                                                                    </div>
                                                                                    <p className="text-cyan-300 text-[10px] font-mono select-all">{m.prompt || m.instruction}</p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </details>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
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

                                        {/* Edit Button */}
                                        <button
                                            onClick={() => setEditorImage(selectedImage.imageUrl)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-blue-900/20 whitespace-nowrap"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            加字/編輯
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
                                                    if (data.prompt) {
                                                        // Save to state instead of directly sending to form
                                                        setReversePromptResult(data.prompt);
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

                                        {/* Reverse Prompt Result Display */}
                                        {reversePromptResult && (
                                            <div className="flex-[2] p-3 bg-amber-900/20 border border-amber-500/30 rounded-xl">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-amber-400 text-xs font-medium">🔍 反推結果</span>
                                                    <button
                                                        onClick={() => setReversePromptResult(null)}
                                                        className="text-gray-500 hover:text-white text-xs"
                                                    >✕</button>
                                                </div>
                                                <p className="text-gray-300 text-[10px] mb-2 max-h-20 overflow-y-auto">{reversePromptResult}</p>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => {
                                                            handleCopyPrompt(reversePromptResult);
                                                        }}
                                                        className="flex-1 text-[9px] py-1 bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white rounded transition-colors"
                                                    >📋 複製</button>
                                                    <button
                                                        onClick={() => {
                                                            if (onReuse) {
                                                                onReuse({ prompt: reversePromptResult });
                                                                setSelectedImage(null);
                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                            }
                                                        }}
                                                        className="flex-1 text-[9px] py-1 bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white rounded transition-colors"
                                                    >📝 填入表單</button>
                                                    <button
                                                        onClick={async () => {
                                                            if (!selectedImage || !reversePromptResult) return;
                                                            try {
                                                                // Translate to Chinese first
                                                                const translateRes = await fetch('/api/translate', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({
                                                                        text: reversePromptResult,
                                                                        targetLang: 'zh-TW',
                                                                        apiKey: localStorage.getItem('geminiApiKey') || ''
                                                                    })
                                                                });
                                                                let promptZh = reversePromptResult;
                                                                if (translateRes.ok) {
                                                                    const translateData = await translateRes.json();
                                                                    promptZh = translateData.translated || promptZh;
                                                                }

                                                                const res = await fetch(`/api/prompts/${selectedImage.id}`, {
                                                                    method: 'PATCH',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({
                                                                        prompt: reversePromptResult,
                                                                        promptZh: promptZh,
                                                                        originalPrompt: promptZh
                                                                    })
                                                                });
                                                                if (!res.ok) throw new Error('更新失敗');
                                                                setSelectedImage({
                                                                    ...selectedImage, prompt: reversePromptResult, promptZh: promptZh,
                                                                    originalPrompt: promptZh
                                                                });
                                                                fetchPrompts();
                                                                setReversePromptResult(null);
                                                                alert('✅ 已儲存英文+中文 Prompt！');
                                                            } catch (err: any) {
                                                                alert('儲存失敗：' + err.message);
                                                            }
                                                        }}
                                                        className="flex-1 text-[9px] py-1 bg-green-600/30 hover:bg-green-600 text-green-300 hover:text-white rounded transition-colors"
                                                    >💾 儲存（含中文）</button>
                                                </div>
                                            </div>
                                        )}

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

                                        {/* AI Structured Analysis Button */}
                                        <button
                                            onClick={async () => {
                                                setStructuredLoading(true);
                                                setStructuredJson(null);
                                                try {
                                                    const res = await fetch('/api/parse-prompt', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            prompt: selectedImage.prompt,
                                                            apiKey: localStorage.getItem('geminiApiKey') || ''
                                                        })
                                                    });
                                                    if (!res.ok) throw new Error(await res.text());
                                                    const data = await res.json();
                                                    if (data.structured) {
                                                        setStructuredJson(data.structured);
                                                    } else if (data.raw) {
                                                        setStructuredJson({ raw: data.raw, error: data.error });
                                                    }
                                                } catch (err: any) {
                                                    setStructuredJson({ error: err.message });
                                                } finally {
                                                    setStructuredLoading(false);
                                                }
                                            }}
                                            disabled={structuredLoading}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-200 hover:text-white border border-cyan-500/30 rounded-xl text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-50"
                                            title="AI 分析 Prompt 結構"
                                        >
                                            {structuredLoading ? '分析中...' : '🧠 結構分析'}
                                        </button>

                                        {/* Deep Image Analysis Button */}
                                        <button
                                            onClick={async () => {
                                                setDeepAnalysisLoading(true);
                                                setDeepAnalysis(null);
                                                try {
                                                    // Get image as base64
                                                    const imgRes = await fetch(selectedImage.imageUrl!);
                                                    const blob = await imgRes.blob();
                                                    const reader = new FileReader();
                                                    const base64 = await new Promise<string>((resolve) => {
                                                        reader.onloadend = () => resolve(reader.result as string);
                                                        reader.readAsDataURL(blob);
                                                    });

                                                    const res = await fetch('/api/analyze-image', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            imageBase64: base64,
                                                            apiKey: localStorage.getItem('geminiApiKey') || ''
                                                        })
                                                    });
                                                    if (!res.ok) throw new Error(await res.text());
                                                    const data = await res.json();
                                                    setDeepAnalysis(data);
                                                } catch (err: any) {
                                                    setDeepAnalysis({ error: err.message });
                                                } finally {
                                                    setDeepAnalysisLoading(false);
                                                }
                                            }}
                                            disabled={deepAnalysisLoading}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-violet-600/20 hover:bg-violet-600 text-violet-200 hover:text-white border border-violet-500/30 rounded-xl text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-50"
                                            title="深度分析圖片（構圖、風格、標籤等）"
                                        >
                                            {deepAnalysisLoading ? '分析中...' : '🔬 深度分析'}
                                        </button>

                                        {/* Comprehensive Evaluation Button */}
                                        <button
                                            onClick={async () => {
                                                setComprehensiveLoading(true);
                                                setComprehensiveEval(null);
                                                try {
                                                    // Get image as base64
                                                    const imgRes = await fetch(selectedImage.imageUrl!);
                                                    const blob = await imgRes.blob();
                                                    const reader = new FileReader();
                                                    const base64 = await new Promise<string>((resolve) => {
                                                        reader.onloadend = () => resolve(reader.result as string);
                                                        reader.readAsDataURL(blob);
                                                    });

                                                    const res = await fetch('/api/comprehensive-eval', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            imageBase64: base64,
                                                            apiKey: localStorage.getItem('geminiApiKey') || ''
                                                        })
                                                    });
                                                    if (!res.ok) throw new Error(await res.text());
                                                    const data = await res.json();
                                                    setComprehensiveEval(data);
                                                    setShowEvalModal(true);
                                                } catch (err: any) {
                                                    setComprehensiveEval({ error: err.message });
                                                    setShowEvalModal(true);
                                                } finally {
                                                    setComprehensiveLoading(false);
                                                }
                                            }}
                                            disabled={comprehensiveLoading}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-600/20 to-orange-600/20 hover:from-amber-600 hover:to-orange-600 text-amber-200 hover:text-white border border-amber-500/30 rounded-xl text-sm font-medium transition-all whitespace-nowrap disabled:opacity-50"
                                            title="全面性評估（AI檢測、版權、市場價值等）"
                                        >
                                            {comprehensiveLoading ? '評估中...' : '📊 全面評估'}
                                        </button>

                                        {/* AI Art Director (Analyze Composition) */}
                                        <button
                                            onClick={async () => {
                                                setCompositionLoading(true);
                                                setCompositionAnalysis(null);
                                                try {
                                                    const imgRes = await fetch(selectedImage.imageUrl!);
                                                    const blob = await imgRes.blob();
                                                    const base64 = await new Promise<string>((resolve) => {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => resolve(reader.result as string);
                                                        reader.readAsDataURL(blob);
                                                    });

                                                    const res = await fetch('/api/analyze-composition', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            imageBase64: base64,
                                                            apiKey: localStorage.getItem('geminiApiKey') || ''
                                                        })
                                                    });
                                                    if (!res.ok) throw new Error(await res.text());
                                                    const data = await res.json();
                                                    setCompositionAnalysis(data);
                                                } catch (err: any) {
                                                    alert('構圖分析失敗：' + err.message);
                                                } finally {
                                                    setCompositionLoading(false);
                                                }
                                            }}
                                            disabled={compositionLoading}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/30 rounded-xl text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-50"
                                            title="AI 藝術指導：分析畫面構圖與焦點"
                                        >
                                            {compositionLoading ? '分析中...' : '📐 構圖指導'}
                                        </button>

                                        {/* Regional Tagging (Detective Mode) */}
                                        <button
                                            onClick={async () => {
                                                if (isDetectiveMode) {
                                                    setIsDetectiveMode(false);
                                                    return;
                                                }

                                                setIsDetectiveMode(true);
                                                if (detections.length > 0) return; // Already loaded

                                                setDetectingLoading(true);
                                                try {
                                                    const imgRes = await fetch(selectedImage.imageUrl!);
                                                    const blob = await imgRes.blob();
                                                    const base64 = await new Promise<string>((resolve) => {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => resolve(reader.result as string);
                                                        reader.readAsDataURL(blob);
                                                    });

                                                    const res = await fetch('/api/detect-objects', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            imageBase64: base64,
                                                            apiKey: localStorage.getItem('geminiApiKey') || ''
                                                        })
                                                    });
                                                    if (!res.ok) throw new Error(await res.text());
                                                    const data = await res.json();
                                                    if (data.detections) {
                                                        setDetections(data.detections);
                                                    }
                                                } catch (err: any) {
                                                    alert('偵探模式啟動失敗：' + err.message);
                                                    setIsDetectiveMode(false);
                                                } finally {
                                                    setDetectingLoading(false);
                                                }
                                            }}
                                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${isDetectiveMode ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/40' : 'bg-cyan-600/20 hover:bg-cyan-600 text-cyan-200 hover:text-white border border-cyan-500/30'}`}
                                            title="偵探模式：交互式物件辨識與標籤"
                                        >
                                            {isDetectiveMode ? '✕ 關閉偵探' : '🔍 偵探模式'}
                                        </button>

                                        {/* Smart Crop Button */}
                                        <button
                                            onClick={async () => {
                                                if (smartCropData) {
                                                    setSmartCropData(null);
                                                    setSelectedCrop(null);
                                                    return;
                                                }

                                                setSmartCropLoading(true);
                                                try {
                                                    const imgRes = await fetch(selectedImage.imageUrl!);
                                                    const blob = await imgRes.blob();
                                                    const base64 = await new Promise<string>((resolve) => {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => resolve(reader.result as string);
                                                        reader.readAsDataURL(blob);
                                                    });

                                                    const res = await fetch('/api/smart-crop', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            imageBase64: base64,
                                                            apiKey: localStorage.getItem('geminiApiKey') || ''
                                                        })
                                                    });
                                                    if (!res.ok) throw new Error(await res.text());
                                                    const data = await res.json();
                                                    setSmartCropData(data);
                                                    setSelectedCrop(0);
                                                } catch (err: any) {
                                                    alert('智能裁切分析失敗：' + err.message);
                                                } finally {
                                                    setSmartCropLoading(false);
                                                }
                                            }}
                                            disabled={smartCropLoading}
                                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap disabled:opacity-50 ${smartCropData ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40' : 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/30'}`}
                                            title="智能裁切：AI 建議最佳裁切區域"
                                        >
                                            {smartCropLoading ? '分析中...' : smartCropData ? '✕ 關閉裁切' : '✂️ 智能裁切'}
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

            {/* Style Fusion Dialog */}
            {fusionDialogData && (
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
            )}

            {/* Comprehensive Evaluation Modal */}
            {showEvalModal && comprehensiveEval && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowEvalModal(false)}
                >
                    <div
                        className="bg-gray-900 border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-white/10 shrink-0">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                📊 全面性評估報告
                                {comprehensiveEval.overallScore && (
                                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${comprehensiveEval.overallScore.grade === 'A' ? 'bg-green-500/20 text-green-400' :
                                        comprehensiveEval.overallScore.grade === 'B' ? 'bg-blue-500/20 text-blue-400' :
                                            comprehensiveEval.overallScore.grade === 'C' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-red-500/20 text-red-400'
                                        }`}>
                                        {comprehensiveEval.overallScore.grade} ({comprehensiveEval.overallScore.total}/100)
                                    </span>
                                )}
                            </h2>
                            <div className="flex items-center gap-2">
                                {/* View Toggle */}
                                <div className="bg-gray-800 rounded-lg p-1 flex mr-4 border border-gray-700">
                                    <button
                                        onClick={() => setShowSocialPreview(false)}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${!showSocialPreview ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        📝 報告
                                    </button>
                                    <button
                                        onClick={() => setShowSocialPreview(true)}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showSocialPreview ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        📱 預覽
                                    </button>
                                </div>

                                {!showSocialPreview && (
                                    <>
                                        {/* Export Button */}
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch('/api/export-report', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            evaluation: comprehensiveEval,
                                                            imageInfo: selectedImage,
                                                            format: 'markdown'
                                                        })
                                                    });
                                                    if (!res.ok) throw new Error('匯出失敗');
                                                    const data = await res.json();
                                                    // Download as file
                                                    const blob = new Blob([data.content], { type: 'text/markdown' });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = data.filename;
                                                    a.click();
                                                    URL.revokeObjectURL(url);
                                                } catch (err) {
                                                    alert('匯出報告失敗');
                                                }
                                            }}
                                            className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600 text-green-300 hover:text-white rounded-lg text-sm transition-colors"
                                        >
                                            📥 匯出 MD
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch('/api/export-report', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            evaluation: comprehensiveEval,
                                                            imageInfo: selectedImage,
                                                            format: 'html'
                                                        })
                                                    });
                                                    if (!res.ok) throw new Error('匯出失敗');
                                                    const data = await res.json();
                                                    // Download as file
                                                    const blob = new Blob([data.content], { type: 'text/html' });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = data.filename;
                                                    a.click();
                                                    URL.revokeObjectURL(url);
                                                } catch (err) {
                                                    alert('匯出 HTML 失敗');
                                                }
                                            }}
                                            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-sm transition-colors"
                                        >
                                            🌐 匯出 HTML
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => setShowEvalModal(false)}
                                    className="text-gray-500 hover:text-white text-2xl"
                                >×</button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto p-4 space-y-4">
                            {comprehensiveEval.error ? (
                                <div className="text-red-400 p-4 bg-red-500/10 rounded-lg">
                                    ❌ 評估失敗：{comprehensiveEval.error}
                                </div>
                            ) : (
                                showSocialPreview ? (
                                    <div className="flex items-center justify-center min-h-[60vh] bg-gray-50/5 rounded-xl p-8">
                                        <SocialPreview
                                            imageUrl={selectedImage?.imageUrl || ''}
                                            analysis={comprehensiveEval}
                                            isLoading={false}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        {/* Overall Summary */}
                                        {comprehensiveEval.overallScore?.summary && (
                                            <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
                                                <p className="text-amber-200 text-center text-lg">{comprehensiveEval.overallScore.summary}</p>
                                            </div>
                                        )}

                                        {/* Radar Scores */}
                                        {comprehensiveEval.radarScores && (
                                            <details className="group" open>
                                                <summary className="p-3 bg-white/5 rounded-lg cursor-pointer list-none">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-cyan-400 font-medium">📈 五維度評分</span>
                                                        <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                    </div>
                                                </summary>
                                                <div className="p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                                                    {[
                                                        { key: 'composition', label: '🎨 構圖', color: 'from-pink-500 to-rose-500' },
                                                        { key: 'color', label: '🌈 色彩', color: 'from-purple-500 to-violet-500' },
                                                        { key: 'creativity', label: '💡 創意', color: 'from-amber-500 to-yellow-500' },
                                                        { key: 'technical', label: '⚙️ 技術', color: 'from-cyan-500 to-blue-500' },
                                                        { key: 'emotion', label: '💖 情感', color: 'from-red-500 to-pink-500' },
                                                    ].map(dim => {
                                                        const data = comprehensiveEval.radarScores[dim.key];
                                                        return data ? (
                                                            <div key={dim.key} className="p-3 bg-white/5 rounded-xl text-center">
                                                                <div className="text-2xl font-bold bg-gradient-to-r ${dim.color} bg-clip-text text-transparent">
                                                                    {data.score}/10
                                                                </div>
                                                                <div className="text-xs text-gray-400 mt-1">{dim.label}</div>
                                                                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                                                                    <div className={`h-1.5 rounded-full bg-gradient-to-r ${dim.color}`} style={{ width: `${data.score * 10}%` }}></div>
                                                                </div>
                                                                {data.comment && <div className="text-[10px] text-gray-500 mt-2">{data.comment}</div>}
                                                            </div>
                                                        ) : null;
                                                    })}
                                                </div>
                                            </details>
                                        )}

                                        {/* AI Detection */}
                                        {comprehensiveEval.aiDetection && (
                                            <details className="group">
                                                <summary className="p-3 bg-white/5 rounded-lg cursor-pointer list-none">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-purple-400 font-medium">🤖 AI 生成檢測</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 rounded text-xs ${comprehensiveEval.aiDetection.isAiGenerated
                                                                ? 'bg-purple-500/20 text-purple-300'
                                                                : 'bg-green-500/20 text-green-300'
                                                                }`}>
                                                                {comprehensiveEval.aiDetection.isAiGenerated ? '🤖 AI 生成' : '📷 非 AI'}
                                                            </span>
                                                            <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                        </div>
                                                    </div>
                                                </summary>
                                                <div className="p-3 space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-gray-500 text-sm">可信度：</span>
                                                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                                                            <div className="h-2 rounded-full bg-purple-500" style={{ width: `${(comprehensiveEval.aiDetection.confidence || 0) * 100}%` }}></div>
                                                        </div>
                                                        <span className="text-purple-300 text-sm">{Math.round((comprehensiveEval.aiDetection.confidence || 0) * 100)}%</span>
                                                    </div>
                                                    {comprehensiveEval.aiDetection.aiTool && (
                                                        <p className="text-gray-300 text-sm"><span className="text-gray-500">推測工具：</span>{comprehensiveEval.aiDetection.aiTool}</p>
                                                    )}
                                                    {comprehensiveEval.aiDetection.indicators?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {comprehensiveEval.aiDetection.indicators.map((ind: string, i: number) => (
                                                                <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-[10px]">{ind}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </details>
                                        )}

                                        {/* Copyright Risk */}
                                        {comprehensiveEval.copyrightRisk && (
                                            <details className="group">
                                                <summary className="p-3 bg-white/5 rounded-lg cursor-pointer list-none">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-yellow-400 font-medium">⚠️ 版權風險</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 rounded text-xs ${comprehensiveEval.copyrightRisk.riskLevel === 'low' ? 'bg-green-500/20 text-green-300' :
                                                                comprehensiveEval.copyrightRisk.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                                                    'bg-red-500/20 text-red-300'
                                                                }`}>
                                                                {comprehensiveEval.copyrightRisk.riskLevel === 'low' ? '🟢 低風險' :
                                                                    comprehensiveEval.copyrightRisk.riskLevel === 'medium' ? '🟡 中風險' : '🔴 高風險'}
                                                            </span>
                                                            <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                        </div>
                                                    </div>
                                                </summary>
                                                <div className="p-3 space-y-2">
                                                    {comprehensiveEval.copyrightRisk.concerns?.length > 0 && (
                                                        <div className="space-y-2">
                                                            {comprehensiveEval.copyrightRisk.concerns.map((c: any, i: number) => (
                                                                <div key={i} className="p-2 bg-yellow-500/10 rounded text-sm">
                                                                    <span className="text-yellow-400 font-medium">{c.type}</span>
                                                                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${c.severity === 'high' ? 'bg-red-500/30 text-red-300' :
                                                                        c.severity === 'medium' ? 'bg-yellow-500/30 text-yellow-300' :
                                                                            'bg-green-500/30 text-green-300'
                                                                        }`}>{c.severity}</span>
                                                                    <p className="text-gray-400 text-xs mt-1">{c.description}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {comprehensiveEval.copyrightRisk.recommendation && (
                                                        <p className="text-green-300 text-sm p-2 bg-green-500/10 rounded">
                                                            💡 {comprehensiveEval.copyrightRisk.recommendation}
                                                        </p>
                                                    )}
                                                </div>
                                            </details>
                                        )}

                                        {/* Improvement Roadmap */}
                                        {comprehensiveEval.improvementRoadmap?.length > 0 && (
                                            <details className="group">
                                                <summary className="p-3 bg-white/5 rounded-lg cursor-pointer list-none">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-emerald-400 font-medium">🛠️ 優化路線圖 ({comprehensiveEval.improvementRoadmap.length})</span>
                                                        <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                    </div>
                                                </summary>
                                                <div className="p-3 space-y-3">
                                                    {comprehensiveEval.improvementRoadmap.map((item: any, i: number) => (
                                                        <div key={i} className="p-3 bg-white/5 rounded-lg border-l-4 border-emerald-500">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">{item.priority || i + 1}</span>
                                                                <span className="text-white font-medium">{item.area}</span>
                                                                <span className={`px-2 py-0.5 rounded text-[10px] ${item.difficulty === 'easy' ? 'bg-green-500/20 text-green-300' :
                                                                    item.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                                                        'bg-red-500/20 text-red-300'
                                                                    }`}>{item.difficulty === 'easy' ? '簡單' : item.difficulty === 'medium' ? '中等' : '困難'}</span>
                                                            </div>
                                                            <p className="text-gray-400 text-xs"><span className="text-gray-500">目前：</span>{item.current}</p>
                                                            <p className="text-gray-300 text-xs mt-1"><span className="text-gray-500">目標：</span>{item.target}</p>
                                                            {item.action && (
                                                                <div className="mt-2 p-2 bg-black/40 rounded">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-gray-500 text-[10px]">Prompt:</span>
                                                                        <button
                                                                            onClick={() => {
                                                                                navigator.clipboard.writeText(item.action);
                                                                                alert('已複製！');
                                                                            }}
                                                                            className="text-[9px] px-1.5 py-0.5 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded"
                                                                        >複製</button>
                                                                    </div>
                                                                    <p className="text-cyan-300 text-[10px] font-mono mt-1">{item.action}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </details>
                                        )}

                                        {/* Market Value */}
                                        {comprehensiveEval.marketValue && (
                                            <details className="group">
                                                <summary className="p-3 bg-white/5 rounded-lg cursor-pointer list-none">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-amber-400 font-medium">💰 市場價值評估</span>
                                                        <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                    </div>
                                                </summary>
                                                <div className="p-3 space-y-3">
                                                    {comprehensiveEval.marketValue.estimatedPrice && (
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <div className="p-2 bg-white/5 rounded text-center">
                                                                <div className="text-xs text-gray-500">圖庫授權</div>
                                                                <div className="text-amber-300 font-bold">{comprehensiveEval.marketValue.estimatedPrice.stockPhoto}</div>
                                                            </div>
                                                            <div className="p-2 bg-white/5 rounded text-center">
                                                                <div className="text-xs text-gray-500">商業授權</div>
                                                                <div className="text-amber-300 font-bold">{comprehensiveEval.marketValue.estimatedPrice.commercial}</div>
                                                            </div>
                                                            <div className="p-2 bg-white/5 rounded text-center">
                                                                <div className="text-xs text-gray-500">獨家授權</div>
                                                                <div className="text-amber-300 font-bold">{comprehensiveEval.marketValue.estimatedPrice.exclusive}</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <p><span className="text-gray-500">市場需求：</span><span className="text-gray-300">{comprehensiveEval.marketValue.demandLevel}</span></p>
                                                        <p><span className="text-gray-500">競爭力：</span><span className="text-gray-300">{comprehensiveEval.marketValue.competitiveness}</span></p>
                                                    </div>
                                                    {comprehensiveEval.marketValue.suitablePlatforms?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {comprehensiveEval.marketValue.suitablePlatforms.map((p: string, i: number) => (
                                                                <span key={i} className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded text-[10px]">{p}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </details>
                                        )}

                                        {/* Expert Comment */}
                                        {comprehensiveEval.expertComment && (
                                            <details className="group" open>
                                                <summary className="p-3 bg-white/5 rounded-lg cursor-pointer list-none">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-blue-400 font-medium">💬 專家評語</span>
                                                        <svg className="w-4 h-4 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                    </div>
                                                </summary>
                                                <div className="p-3 space-y-2">
                                                    {comprehensiveEval.expertComment.strengths?.length > 0 && (
                                                        <div>
                                                            <p className="text-green-400 text-sm font-medium mb-1">✅ 優點</p>
                                                            <ul className="space-y-1">
                                                                {comprehensiveEval.expertComment.strengths.map((s: string, i: number) => (
                                                                    <li key={i} className="text-gray-300 text-xs pl-3">• {s}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {comprehensiveEval.expertComment.weaknesses?.length > 0 && (
                                                        <div>
                                                            <p className="text-yellow-400 text-sm font-medium mb-1">⚠️ 需注意</p>
                                                            <ul className="space-y-1">
                                                                {comprehensiveEval.expertComment.weaknesses.map((w: string, i: number) => (
                                                                    <li key={i} className="text-gray-300 text-xs pl-3">• {w}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {comprehensiveEval.expertComment.professionalTip && (
                                                        <div className="p-3 bg-blue-500/10 rounded-lg border-l-4 border-blue-500 mt-2">
                                                            <p className="text-blue-300 text-sm">💡 {comprehensiveEval.expertComment.professionalTip}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </details>
                                        )}
                                    </>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Image Editor */}
            {editorImage && (
                <ImageEditor
                    isOpen={!!editorImage}
                    onClose={() => setEditorImage(null)}
                    initialImageUrl={editorImage}
                />
            )}
        </div>

    );
}

