"use client";

import { useEffect, useState, useRef } from "react";
import ABCompare from "./ABCompare";
import StyleFusionDialog from "./StyleFusionDialog";
import SocialPreview from "./SocialPreview";

import InspirationMap from "./InspirationMap";
import ImageEditor from "./ImageEditor";
import GalleryToolbar from "./GalleryToolbar";
import Image from "next/image";
import {
    Search, Trash2, ImageIcon, Loader2, Download, Zap, X, ExternalLink,
    Scissors, Brain, Microscope, BarChart3, Layout, Crosshair,
    Maximize, Copy, Heart, Edit3, Play, Sparkles
} from "lucide-react";

// Sub-component for individual Gallery Cards
function GalleryCard({
    item,
    isSelectionMode,
    isSelected,
    onToggleSelection,
    onSelect,
    onToggleFavorite,
    onDelete,
    onVariation
}: {
    item: PromptEntry,
    isSelectionMode: boolean,
    isSelected: boolean,
    onToggleSelection: (id: string) => void,
    onSelect: (item: PromptEntry) => void,
    onToggleFavorite: (e: React.MouseEvent, id: string, current: boolean) => void,
    onDelete: (id: string) => void,
    onVariation: (item: PromptEntry) => void
}) {
    const [imageLoaded, setImageLoaded] = useState(false);

    // Calculate aspect ratio for the placeholder
    const aspectRatio = item.width && item.height ? (item.height / item.width) * 100 : 100;

    return (
        <div
            onClick={() => {
                if (isSelectionMode) {
                    onToggleSelection(item.id);
                } else {
                    onSelect(item);
                }
            }}
            className={`break-inside-avoid group relative bg-white/5 rounded-2xl overflow-hidden border transition-all hover:shadow-2xl cursor-pointer ${isSelected
                ? "border-red-500 shadow-lg shadow-red-500/20"
                : "border-white/10 hover:shadow-purple-500/10"
                }`}
        >
            {/* Selection Checkbox */}
            {isSelectionMode && (
                <div className="absolute top-3 left-3 z-20">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                        ? "bg-red-500 border-red-500"
                        : "bg-black/50 border-white/50 group-hover:border-white"
                        }`}>
                        {isSelected && (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                </div>
            )}

            {/* Image Container with Skeleton */}
            <div className="relative w-full overflow-hidden bg-white/5" style={{ paddingBottom: imageLoaded ? '0' : `${aspectRatio}%` }}>
                {!imageLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 animate-pulse flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-white/10" />
                    </div>
                )}

                {item.imageUrl && (
                    <Image
                        src={item.imageUrl}
                        alt={item.prompt}
                        width={item.width || 1024}
                        height={item.height || 1024}
                        onLoad={() => setImageLoaded(true)}
                        className={`w-full h-auto object-cover transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        loading="lazy"
                        unoptimized={true} // For local uploads if not using a cloud provider with loaders
                    />
                )}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end z-10">
                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-2">
                    {item.tags && item.tags.split(',').slice(0, 3).map((tag, idx) => (
                        <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm bg-white/10 text-white/80"
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
                            onClick={(e) => onToggleFavorite(e, item.id, item.isFavorite)}
                            className={`p-2 rounded-full transition-colors ${item.isFavorite ? "text-pink-500 bg-pink-500/10" : "text-white/50 hover:text-white hover:bg-white/10"}`}
                        >
                            <svg className={`w-4 h-4 ${item.isFavorite ? "fill-current" : "stroke-current fill-none"}`} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onVariation(item);
                            }}
                            className="p-2 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-200 hover:text-white rounded-full transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("確定要刪除這張圖片嗎？")) onDelete(item.id);
                            }}
                            className="p-2 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white rounded-full transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

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
    engine?: string;
    modelName?: string;
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
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Tagging & UI States
    const [tagInput, setTagInput] = useState("");
    const [isTagUpdating, setIsTagUpdating] = useState(false);
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
            setTagInput("");
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

    const handleTagUpdate = async (id: string, newTags: string) => {
        setIsTagUpdating(true);
        try {
            const res = await fetch(`/api/prompts/${id}/tags`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tags: newTags }),
            });

            if (res.ok) {
                const updatedData = await res.json();
                // Update local state
                setPrompts(prev => prev.map(p => p.id === id ? { ...p, tags: newTags } : p));
                if (selectedImage && selectedImage.id === id) {
                    setSelectedImage({ ...selectedImage, tags: newTags });
                }
            } else {
                throw new Error("Failed to update tags");
            }
        } catch (error) {
            console.error(error);
            alert("標籤更新失敗");
        } finally {
            setIsTagUpdating(false);
        }
    };

    const handleAddTag = async (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && tagInput.trim() && selectedImage) {
            const currentTags = selectedImage.tags ? selectedImage.tags.split(',').map(t => t.trim()) : [];
            const newTag = tagInput.trim();
            if (!currentTags.includes(newTag)) {
                const updatedTags = [...currentTags, newTag].join(', ');
                await handleTagUpdate(selectedImage.id, updatedTags);
            }
            setTagInput("");
        }
    };

    const handleRemoveTag = async (tagToRemove: string) => {
        if (!selectedImage) return;
        const currentTags = selectedImage.tags ? selectedImage.tags.split(',').map(t => t.trim()) : [];
        const updatedTags = currentTags.filter(t => t !== tagToRemove).join(', ');
        await handleTagUpdate(selectedImage.id, updatedTags);
    };

    const handleSaveReversePrompt = async () => {
        if (!reversePromptResult || !selectedImage) return;
        try {
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

            setPrompts(prev => prev.map(p => p.id === selectedImage.id ? { ...p, prompt: reversePromptResult!, promptZh: promptZh, originalPrompt: promptZh } : p));
            setSelectedImage({ ...selectedImage, prompt: reversePromptResult!, promptZh: promptZh, originalPrompt: promptZh });
            setReversePromptResult(null);
            alert('✅ 已儲存！');
        } catch (err: any) {
            alert('儲存失敗：' + err.message);
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
                                <GalleryCard
                                    key={item.id}
                                    item={item}
                                    isSelectionMode={isSelectionMode}
                                    isSelected={selectedIds.has(item.id)}
                                    onToggleSelection={toggleSelection}
                                    onSelect={setSelectedImage}
                                    onToggleFavorite={toggleFavorite}
                                    onDelete={handleDelete}
                                    onVariation={(item) => {
                                        // variation logic... maybe just set selected image?
                                        setSelectedImage(item);
                                    }}
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
                <div
                    className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300"
                    onClick={() => setSelectedImage(null)}
                >
                    {/* Background feedback toast */}
                    {copyFeedback && (
                        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-green-500 text-white px-6 py-3 rounded-full shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="font-bold">{copyFeedback}</span>
                        </div>
                    )}

                    <div
                        className="relative w-full max-w-7xl h-full flex flex-col md:flex-row bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-6 right-6 z-[70] p-2 bg-black/20 hover:bg-black/40 text-white/70 hover:text-white rounded-full transition-all border border-white/5 hover:border-white/10 backdrop-blur-md"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Left Partition: Big Image */}
                        <div className="w-full md:w-2/3 h-[50vh] md:h-full relative bg-black/60 group overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center p-6">
                                <img
                                    src={selectedImage.imageUrl || ""}
                                    alt={selectedImage.prompt}
                                    className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-transform duration-700 group-hover:scale-[1.01]"
                                />
                            </div>

                            {/* Overlays (Same as before but with better container) */}
                            <div className="absolute inset-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300">
                                {/* Overlays logic... */}
                                {isDetectiveMode && detections.length > 0 && (
                                    <div className="absolute inset-0 p-6">
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            {detections.map((obj, idx) => (
                                                <div
                                                    key={idx}
                                                    className="absolute border-2 border-cyan-400 bg-cyan-400/10 pointer-events-auto cursor-help transition-all hover:bg-cyan-400/30"
                                                    style={{
                                                        top: `${obj.box_2d[0] / 10}%`,
                                                        left: `${obj.box_2d[1] / 10}%`,
                                                        height: `${(obj.box_2d[2] - obj.box_2d[0]) / 10}%`,
                                                        width: `${(obj.box_2d[3] - obj.box_2d[1]) / 10}%`,
                                                    }}
                                                    onMouseEnter={() => setHoveredObject(obj.label_zh || obj.label)}
                                                    onMouseLeave={() => setHoveredObject(null)}
                                                >
                                                    {hoveredObject === (obj.label_zh || obj.label) && (
                                                        <div className="absolute -top-8 left-0 bg-cyan-500 text-white px-2 py-1 rounded text-[10px] whitespace-nowrap z-10">
                                                            {obj.label_zh || obj.label}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {smartCropData && (
                                    <div className="absolute inset-0 p-6">
                                        <div className="relative w-full h-full">
                                            {smartCropData.crops && smartCropData.crops.map((crop: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className={`absolute border-2 transition-all ${selectedCrop === idx ? 'border-emerald-400 bg-emerald-400/20 z-20' : 'border-white/20 bg-white/5 opacity-40'}`}
                                                    style={{
                                                        top: `${crop.box_2d[0] / 10}%`,
                                                        left: `${crop.box_2d[1] / 10}%`,
                                                        height: `${(crop.box_2d[2] - crop.box_2d[0]) / 10}%`,
                                                        width: `${(crop.box_2d[3] - crop.box_2d[1]) / 10}%`,
                                                    }}
                                                >
                                                    {selectedCrop === idx && (
                                                        <div className="absolute -top-6 left-0 bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] whitespace-nowrap">
                                                            {crop.aspect_ratio} 建議
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {compositionAnalysis?.focalPoints && (
                                    <div className="absolute inset-0 p-6">
                                        <div className="relative w-full h-full">
                                            {compositionAnalysis.focalPoints.map((point: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2"
                                                    style={{
                                                        top: `${point.y / 10}%`,
                                                        left: `${point.x / 10}%`,
                                                    }}
                                                >
                                                    <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-75"></div>
                                                    <div className="absolute inset-0 rounded-full border-2 border-amber-400 flex items-center justify-center">
                                                        <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                                                    </div>
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-amber-500 text-white text-[8px] px-1 rounded whitespace-nowrap">
                                                        {point.label}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Info Badges on Image */}
                            <div className="absolute bottom-8 left-8 flex gap-2">
                                <div className="px-3 py-1.5 bg-black/40 backdrop-blur-xl rounded-lg border border-white/5 text-[10px] text-gray-400 font-mono">
                                    {selectedImage.width} × {selectedImage.height}
                                </div>
                                {selectedImage.engine && (
                                    <div className="px-3 py-1.5 bg-indigo-500/20 backdrop-blur-xl rounded-lg border border-indigo-500/20 text-[10px] text-indigo-300 font-bold uppercase tracking-widest">
                                        {selectedImage.engine}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Partition: Professional Sidebar */}
                        <div className="w-full md:w-1/3 h-full overflow-y-auto bg-neutral-900/50 backdrop-blur-3xl border-l border-white/5 custom-scrollbar p-8 pt-16 flex flex-col">
                            <div className="flex-1 space-y-8">
                                {/* Section: Header/Title with Copy */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full" />
                                            提示詞
                                        </h3>
                                        <button
                                            onClick={() => handleCopyPrompt(selectedImage.prompt)}
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all active:scale-95"
                                            title="複製提示詞"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="bg-black/30 rounded-2xl p-5 border border-white/5 relative group">
                                        <p className="text-gray-300 leading-relaxed text-sm font-light select-text selection:bg-purple-500/30">
                                            {selectedImage.prompt}
                                        </p>
                                    </div>
                                </div>

                                {/* Section: Negative Prompt */}
                                {selectedImage.negativePrompt && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                                                <div className="w-1 h-1 bg-red-500 rounded-full" />
                                                Negative Prompt
                                            </span>
                                            <button
                                                onClick={() => handleCopyPrompt(selectedImage.negativePrompt!)}
                                                className="text-[10px] text-gray-600 hover:text-white transition-colors"
                                            >
                                                複製
                                            </button>
                                        </div>
                                        <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/10">
                                            <p className="text-red-300/60 text-[11px] font-mono leading-relaxed select-text">
                                                {selectedImage.negativePrompt}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Section: Technical Parameters */}
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { label: 'Seed', val: selectedImage.seed || 'Auto' },
                                        { label: 'CFG', val: selectedImage.cfgScale || '7.5' },
                                        { label: 'Steps', val: selectedImage.steps || '20' },
                                        { label: 'Smp', val: selectedImage.sampler || 'Euler' }
                                    ].map((p, i) => (
                                        <div key={i} className="py-2.5 px-1 bg-white/[0.03] rounded-xl border border-white/5 flex flex-col items-center">
                                            <span className="text-[9px] text-gray-600 uppercase font-black tracking-tighter mb-0.5">{p.label}</span>
                                            <span className="text-[10px] font-mono text-gray-300 truncate w-full text-center">{p.val}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Section: Tags */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-4 bg-emerald-500/50 rounded-full" />
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">標籤管理</h4>
                                    </div>
                                    <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedImage.tags ? selectedImage.tags.split(',').map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="group flex items-center gap-1.5 px-2.5 py-1 bg-white/5 text-gray-400 rounded-lg border border-white/5 text-[10px] hover:bg-white/10 hover:text-white transition-all"
                                                >
                                                    {tag.trim()}
                                                    <button
                                                        onClick={() => handleRemoveTag(tag.trim())}
                                                        className="w-3.5 h-3.5 rounded-full hover:bg-red-500 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                                                    >
                                                        <X className="w-2 h-2" />
                                                    </button>
                                                </span>
                                            )) : (
                                                <p className="text-[10px] text-gray-600 italic">尚未添加標籤</p>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={handleAddTag}
                                                placeholder="新增標籤..."
                                                className="w-full bg-white/[0.03] border border-white/5 rounded-lg pl-3 pr-10 py-2 text-xs text-white placeholder:text-gray-700 focus:outline-none focus:border-purple-500/50 transition-all"
                                            />
                                            {isTagUpdating && (
                                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-purple-500 animate-spin" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Actions Grouped */}
                                <div className="space-y-6">
                                    {/* Action Subgroup: Essential Tools */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={(e) => toggleFavorite(e, selectedImage.id, selectedImage.isFavorite)}
                                            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${selectedImage.isFavorite
                                                ? "bg-pink-500 border-pink-500 text-white shadow-lg shadow-pink-500/20"
                                                : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                                }`}
                                        >
                                            <Heart className={`w-3.5 h-3.5 ${selectedImage.isFavorite ? 'fill-current' : ''}`} />
                                            {selectedImage.isFavorite ? "已收藏" : "加入收藏"}
                                        </button>
                                        <button
                                            onClick={() => setEditorImage(selectedImage.imageUrl)}
                                            className="flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/5 rounded-xl text-[11px] font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            編輯圖片
                                        </button>
                                        <button
                                            onClick={handleReuse}
                                            className="flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/5 rounded-xl text-[11px] font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                                        >
                                            <Play className="w-3.5 h-3.5" />
                                            重用提示
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm("確定要刪除嗎？")) {
                                                    handleDelete(selectedImage.id);
                                                    setSelectedImage(null);
                                                }
                                            }}
                                            className="flex items-center justify-center gap-2 py-2.5 bg-red-500/5 border border-red-500/10 rounded-xl text-[11px] font-bold text-red-400/60 hover:bg-red-500 hover:text-white transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            刪除圖片
                                        </button>
                                    </div>

                                    {/* Action Subgroup: Analysis Tools */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-3 bg-neutral-600 rounded-full" />
                                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">AI 分析與增強</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={async () => {
                                                    setComprehensiveLoading(true);
                                                    try {
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
                                                            body: JSON.stringify({ imageBase64: base64, apiKey: localStorage.getItem('geminiApiKey') || '' })
                                                        });
                                                        const data = await res.json();
                                                        setComprehensiveEval(data);
                                                        setShowEvalModal(true);
                                                    } catch (err: any) { alert('全面評估失敗'); } finally { setComprehensiveLoading(false); }
                                                }}
                                                disabled={comprehensiveLoading}
                                                className="flex items-center justify-center gap-2 py-2.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-gray-300 rounded-xl text-[11px] font-medium transition-all group"
                                                title="全面性評估（AI檢測、版權、市場價值等）"
                                            >
                                                {comprehensiveLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart3 className="w-3.5 h-3.5" />}
                                                全面評估
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    setDeepAnalysisLoading(true);
                                                    try {
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
                                                            body: JSON.stringify({ imageBase64: base64, apiKey: localStorage.getItem('geminiApiKey') || '' })
                                                        });
                                                        const data = await res.json();
                                                        setDeepAnalysis(data);
                                                    } catch (err: any) { alert('深度分析失敗'); } finally { setDeepAnalysisLoading(false); }
                                                }}
                                                disabled={deepAnalysisLoading}
                                                className="flex items-center justify-center gap-2 py-2.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-gray-300 rounded-xl text-[11px] font-medium transition-all"
                                                title="深度分析圖片（構圖、風格、標籤等）"
                                            >
                                                {deepAnalysisLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Microscope className="w-3.5 h-3.5" />}
                                                深度分析
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    setStructuredLoading(true);
                                                    try {
                                                        const res = await fetch('/api/parse-prompt', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ prompt: selectedImage.prompt, apiKey: localStorage.getItem('geminiApiKey') || '' })
                                                        });
                                                        const data = await res.json();
                                                        setStructuredJson(data.structured || { raw: data.raw, error: data.error });
                                                    } catch (err: any) { alert('結構分析失敗'); } finally { setStructuredLoading(false); }
                                                }}
                                                disabled={structuredLoading}
                                                className="flex items-center justify-center gap-2 py-2.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-gray-300 rounded-xl text-[11px] font-medium transition-all"
                                                title="AI 分析 Prompt 結構"
                                            >
                                                {structuredLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                                                結構分析
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (!selectedImage.imageUrl) return;
                                                    setVariationLoading(true);
                                                    try {
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
                                                        if (!res.ok) throw new Error('去背失敗');
                                                        const data = await res.json();
                                                        if (data.imageBase64) {
                                                            const a = document.createElement('a');
                                                            a.href = `data:${data.mimeType};base64,${data.imageBase64}`;
                                                            a.download = `bg-removed-${selectedImage.id}.png`;
                                                            a.click();
                                                        }
                                                    } catch (err: any) { alert('去背失敗'); } finally { setVariationLoading(false); }
                                                }}
                                                disabled={variationLoading}
                                                className="flex items-center justify-center gap-2 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded-xl text-[11px] font-medium transition-all"
                                                title="移除圖片背景"
                                            >
                                                {variationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scissors className="w-3.5 h-3.5" />}
                                                一鍵去背
                                            </button>
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
                                                disabled={detectingLoading}
                                                className={`flex items-center justify-center gap-2 py-2.5 border rounded-xl text-[11px] font-medium transition-all ${isDetectiveMode ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-neutral-800 border-transparent text-gray-300 hover:bg-neutral-700'}`}
                                                title="偵探模式：交互式物件辨識與標籤"
                                            >
                                                {detectingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
                                                偵探模式
                                            </button>
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
                                                className={`flex items-center justify-center gap-2 py-2.5 border rounded-xl text-[11px] font-medium transition-all ${smartCropData ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-neutral-800 border-transparent text-gray-300 hover:bg-neutral-700'}`}
                                                title="智能裁切：AI 建議最佳裁切區域"
                                            >
                                                {smartCropLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layout className="w-3.5 h-3.5" />}
                                                視覺重組
                                            </button>
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
                                                className="flex items-center justify-center gap-2 py-2.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-gray-300 rounded-xl text-[11px] font-medium transition-all"
                                                title="AI 藝術指導：分析畫面構圖與焦點"
                                            >
                                                {compositionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Microscope className="w-3.5 h-3.5" />}
                                                構圖指導
                                            </button>
                                        </div>
                                    </div>

                                    {/* Action Subgroup: Variations */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1 h-3 bg-indigo-600 rounded-full" />
                                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">創作延展</h4>
                                        </div>
                                        <button
                                            onClick={() => setIsVariationMenuOpen(!isVariationMenuOpen)}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            啟動提示詞接龍
                                        </button>
                                    </div>

                                    {/* Action Subgroup: Download (The prominent one) */}
                                    <div className="pt-4 border-t border-white/5 space-y-3">
                                        <a
                                            href={selectedImage.imageUrl || ""}
                                            download={`prompt-db-${selectedImage.id}.png`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-center gap-3 py-4 bg-white/10 hover:bg-white/15 text-white rounded-2xl text-sm font-bold border border-white/5 backdrop-blur-md transition-all active:scale-[0.98]"
                                        >
                                            <Download className="w-5 h-5" />
                                            下載圖片
                                        </a>
                                        <button
                                            onClick={() => setSelectedImage(null)}
                                            className="w-full py-3 text-gray-500 hover:text-white text-xs font-medium transition-colors"
                                        >
                                            暫時不，返回
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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

            {/* Comprehensive Evaluation Modal */}
            {
                showEvalModal && comprehensiveEval && (
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

