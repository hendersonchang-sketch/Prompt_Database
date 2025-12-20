import { useState, useEffect, useRef } from "react";
import {
    X, Copy, Heart, Play, Trash2, Loader2, BarChart3, Microscope, Brain,
    Scissors, Download, Save, Paintbrush, Sparkles, ZoomIn, ZoomOut, RotateCcw, Zap, ImageIcon
} from "lucide-react";
import { PromptEntry } from "./PromptCard";
import SocialPreview from "./SocialPreview";

interface ImageModalProps {
    selectedImage: PromptEntry;
    onClose: () => void;
    toggleFavorite: (e: React.MouseEvent, id: string, current: boolean) => void;
    handleReuse: (image: PromptEntry) => void;
    handleDelete: (id: string) => void;
    onTagUpdate?: (id: string, newTags: string) => void;
    onPromptUpdate?: (id: string, prompt: string, promptZh?: string) => void;
    handleCopyPrompt: (text: string) => void;
    copyFeedback: string | null;
    handleSetAsReference?: (image: PromptEntry) => void;
}

export function ImageModal({
    selectedImage: initialImage,
    onClose,
    toggleFavorite,
    handleReuse,
    handleDelete,
    onTagUpdate,
    onPromptUpdate,
    handleCopyPrompt,
    copyFeedback,
    handleSetAsReference
}: ImageModalProps) {
    const [selectedImage, setSelectedImage] = useState(initialImage);

    const [comprehensiveEval, setComprehensiveEval] = useState<any>(null);
    const [comprehensiveLoading, setComprehensiveLoading] = useState(false);
    const [showEvalModal, setShowEvalModal] = useState(false);
    const [showSocialPreview, setShowSocialPreview] = useState(false);

    const [deepAnalysis, setDeepAnalysis] = useState<any>(null);
    const [deepAnalysisLoading, setDeepAnalysisLoading] = useState(false);

    const [structuredJson, setStructuredJson] = useState<any>(null);
    const [structuredLoading, setStructuredLoading] = useState(false);

    const [isRemovingBg, setIsRemovingBg] = useState(false);

    // 去背預覽狀態
    const [removedBgPreview, setRemovedBgPreview] = useState<string | null>(null);

    // Toast State
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Scroll Management Refs
    const sidebarRef = useRef<HTMLDivElement>(null);
    const promptSectionRef = useRef<HTMLDivElement>(null);

    // Tagging State
    const [tagInput, setTagInput] = useState("");
    const [isTagUpdating, setIsTagUpdating] = useState(false);
    const [zoomScale, setZoomScale] = useState(1);
    const [panOrigin, setPanOrigin] = useState({ x: 50, y: 50 });

    const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.25, 5));
    const handleZoomOut = () => {
        const newScale = Math.max(zoomScale - 0.25, 0.5);
        setZoomScale(newScale);
        if (newScale <= 1) setPanOrigin({ x: 50, y: 50 });
    };
    const handleResetZoom = () => {
        setZoomScale(1);
        setPanOrigin({ x: 50, y: 50 });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (zoomScale <= 1) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setPanOrigin({ x, y });
    };

    // Reuse Confirmation Modal State
    const [isReuseConfirmOpen, setIsReuseConfirmOpen] = useState(false);
    const [reversePromptResult, setReversePromptResult] = useState<{ en: string; zh: string } | null>(null);
    const [reversePromptLoading, setReversePromptLoading] = useState(false);

    // Sync selectedImage if initialImage changes
    useEffect(() => {
        setSelectedImage(initialImage);
        setZoomScale(1); // Reset zoom on image change
        setPanOrigin({ x: 50, y: 50 });
    }, [initialImage]);

    // Tag Handlers
    const handleTagUpdateInternal = async (id: string, newTags: string) => {
        setIsTagUpdating(true);
        try {
            const res = await fetch(`/ api / prompts / ${id}/tags`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tags: newTags }),
            });

            if (res.ok) {
                setSelectedImage(prev => ({ ...prev, tags: newTags }));
                if (onTagUpdate) onTagUpdate(id, newTags);
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
        if (e.key === "Enter" && tagInput.trim()) {
            const currentTags = selectedImage.tags ? selectedImage.tags.split(',').map(t => t.trim()) : [];
            const newTag = tagInput.trim();
            if (!currentTags.includes(newTag)) {
                const updatedTags = [...currentTags, newTag].join(', ');
                await handleTagUpdateInternal(selectedImage.id, updatedTags);
            }
            setTagInput("");
        }
    };

    const handleRemoveTag = async (tagToRemove: string) => {
        const currentTags = selectedImage.tags ? selectedImage.tags.split(',').map(t => t.trim()) : [];
        const updatedTags = currentTags.filter(t => t !== tagToRemove).join(', ');
        await handleTagUpdateInternal(selectedImage.id, updatedTags);
    };

    // Helper: Get Base64
    const getBase64 = async (url: string) => {
        const imgRes = await fetch(url);
        const blob = await imgRes.blob();
        const reader = new FileReader();
        return new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    };

    // Helper: Show Toast
    const showToast = (message: string, duration = 3000) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), duration);
    };

    // 存入圖庫 (僅用於去背後圖片更新)
    const handleSaveToLibrary = async () => {
        if (!removedBgPreview) return;

        setIsRemovingBg(true);
        try {
            const res = await fetch(`/api/prompts/${selectedImage.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl: removedBgPreview,
                    prompt: selectedImage.prompt,
                    promptZh: selectedImage.promptZh,
                })
            });
            if (res.ok) {
                showToast('✅ 已成功將去背圖片存入圖庫');
                setRemovedBgPreview(null);
                setSelectedImage(prev => ({
                    ...prev,
                    imageUrl: removedBgPreview
                }));
            } else {
                throw new Error('儲存失敗');
            }
        } catch (err) {
            showToast('❌ 儲存失敗，請稍後再試');
            console.error('Save to library error:', err);
        } finally {
            setIsRemovingBg(false);
        }
    };

    // Handle Reverse Prompt (AI-powered)
    const handleReversePrompt = async () => {
        setReversePromptLoading(true);
        setIsReuseConfirmOpen(true);
        setReversePromptResult(null);

        try {
            const apiKey = localStorage.getItem('geminiApiKey');
            if (!apiKey) {
                alert('請先在設定中輸入 Gemini API Key');
                setIsReuseConfirmOpen(false);
                return;
            }

            // Client-side image fetching and conversion to base64
            // This prevents issues with server-side fetching of relative URLs
            let base64Image = "";
            try {
                if (!selectedImage.imageUrl) throw new Error("圖片網址為空");
                const imgRes = await fetch(selectedImage.imageUrl);
                const blob = await imgRes.blob();

                // Convert blob to base64
                base64Image = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } catch (fetchErr) {
                console.error("Failed to fetch image client-side:", fetchErr);
                throw new Error("無法讀取圖片資料");
            }

            const res = await fetch('/api/describe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: base64Image, // Send base64 data directly
                    apiKey: apiKey
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || '反推請求失敗');
            }

            const data = await res.json();

            setReversePromptResult({
                en: data.prompt || '',
                zh: data.promptZh || ''
            });
        } catch (error: any) {
            console.error('Reverse prompt error:', error);
            alert(`AI 反推失敗: ${error.message || '請稍後再試'}`);
            setIsReuseConfirmOpen(false);
        } finally {
            setReversePromptLoading(false);
        }
    };

    // Handle Save and Reuse (Database Update + Form Reuse)
    const handleSaveAndReuse = async () => {
        if (!reversePromptResult) return;

        try {
            // 1. Update Database
            const res = await fetch(`/api/prompts/${selectedImage.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: reversePromptResult.en,
                    promptZh: reversePromptResult.zh
                })
            });

            if (!res.ok) throw new Error("儲存失敗");

            // 2. Update Parent State (for Gallery view)
            if (onPromptUpdate) {
                onPromptUpdate(selectedImage.id, reversePromptResult.en, reversePromptResult.zh);
            }

            // 3. Update Local State & Reuse
            const updatedEntry = {
                ...selectedImage,
                prompt: reversePromptResult.en,
                promptZh: reversePromptResult.zh,
                // Crucial: Clear originalPrompt so PromptGallery uses the new prompt
                originalPrompt: undefined
            };

            setIsReuseConfirmOpen(false);
            setReversePromptResult(null);

            // 重要：這會關閉 ImageModal 並填入 Main Input
            handleReuse(updatedEntry);
            onClose();

        } catch (error) {
            console.error("Save error:", error);
            alert("更新資料庫失敗，請確認網路連線");
        }
    };

    return (

        <div
            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300"
            onClick={onClose}
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

            {/* Toast Message */}
            {toastMessage && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-2">
                    <span className="font-bold">{toastMessage}</span>
                </div>
            )}

            <div
                className="relative w-full max-w-7xl h-full flex flex-col md:flex-row bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-[70] p-2 bg-black/20 hover:bg-black/40 text-white/70 hover:text-white rounded-full transition-all border border-white/5 hover:border-white/10 backdrop-blur-md"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Zoom Controls Overlay */}
                <div className="absolute top-6 left-6 z-[70] flex items-center gap-2">
                    <button
                        onClick={handleZoomIn}
                        className="p-2 bg-black/20 hover:bg-black/40 text-white/70 hover:text-white rounded-full transition-all border border-white/5 hover:border-white/10 backdrop-blur-md"
                        title="放大"
                    >
                        <ZoomIn className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleZoomOut}
                        className="p-2 bg-black/20 hover:bg-black/40 text-white/70 hover:text-white rounded-full transition-all border border-white/5 hover:border-white/10 backdrop-blur-md"
                        title="縮小"
                    >
                        <ZoomOut className="w-5 h-5" />
                    </button>
                    {zoomScale !== 1 && (
                        <button
                            onClick={handleResetZoom}
                            className="p-2 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 hover:text-white rounded-full transition-all border border-indigo-500/10 hover:border-indigo-500/20 backdrop-blur-md flex items-center gap-1 px-3"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span className="text-[10px] font-bold">1:1</span>
                        </button>
                    )}
                </div>

                {/* Left Partition: Big Image */}
                <div
                    className="w-full md:w-2/3 h-[50vh] md:h-full relative bg-black/60 group overflow-hidden cursor-crosshair"
                    onMouseMove={handleMouseMove}
                >
                    <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
                        <img
                            src={removedBgPreview || selectedImage.imageUrl || ""}
                            alt={selectedImage.prompt}
                            style={{
                                transform: `scale(${zoomScale})`,
                                transformOrigin: `${panOrigin.x}% ${panOrigin.y}%`
                            }}
                            className={`max-w-full max-h-full object-contain rounded-2xl shadow-2xl ${zoomScale > 1 ? 'transition-none' : 'transition-transform duration-300'}`}
                        />

                        {/* 去背預覽控制按鈕列 */}
                        {removedBgPreview && (
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 z-[80] animate-in zoom-in duration-300">
                                <button
                                    onClick={() => {
                                        const a = document.createElement('a');
                                        a.href = removedBgPreview;
                                        a.download = `bg-removed-${selectedImage.id || 'image'}.png`;
                                        a.click();
                                        showToast('📥 已開始下載');
                                    }}
                                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold flex items-center gap-2 shadow-2xl transition-all active:scale-95"
                                >
                                    <Download className="w-4 h-4" />
                                    下載圖片
                                </button>

                                <button
                                    onClick={handleSaveToLibrary}
                                    disabled={isRemovingBg}
                                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center gap-2 shadow-2xl transition-all active:scale-95"
                                >
                                    {isRemovingBg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    存入圖庫
                                </button>

                                <button
                                    onClick={() => setRemovedBgPreview(null)}
                                    className="px-5 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-2xl font-bold flex items-center gap-2 shadow-2xl transition-all active:scale-95"
                                >
                                    <X className="w-4 h-4" />
                                    取消
                                </button>
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
                <div ref={sidebarRef} className="w-full md:w-1/3 h-full overflow-y-auto bg-neutral-900/50 backdrop-blur-3xl border-l border-white/5 custom-scrollbar p-8 pt-16 flex flex-col">
                    <div className="flex-1 space-y-8">
                        {/* Section: Header/Title with Copy */}
                        <div ref={promptSectionRef} className="space-y-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full" />
                                提示詞
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-black/30 rounded-2xl p-4 border border-white/5 transition-all duration-300">
                                    <div className="flex flex-col gap-4">
                                        <div className="space-y-1 group/item">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">English</span>
                                                <button
                                                    onClick={() => handleCopyPrompt(selectedImage.prompt)}
                                                    className="p-1.5 hover:bg-white/10 rounded-md text-gray-600 hover:text-white transition-all opacity-0 group-hover/item:opacity-100"
                                                    title="複製英文提示詞"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <p className="text-gray-300 leading-relaxed text-sm font-light select-text">
                                                {selectedImage.prompt}
                                            </p>
                                        </div>
                                        <div className="h-px bg-white/5" />
                                        <div className="space-y-1 group/item">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">中文描述</span>
                                                <button
                                                    onClick={() => handleCopyPrompt(selectedImage.promptZh || "")}
                                                    className="p-1.5 hover:bg-white/10 rounded-md text-gray-600 hover:text-white transition-all opacity-0 group-hover/item:opacity-100"
                                                    title="複製中文描述"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <p className="text-white/90 leading-relaxed text-[13px] font-medium select-text">
                                                {selectedImage.promptZh || "（無中文描述）"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
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
                                    {selectedImage.tags ? selectedImage.tags.split(',').map((tag, idx) => {
                                        return (
                                            <span
                                                key={idx}
                                                className="group flex items-center gap-1.5 px-3 py-1 bg-white/5 text-gray-400 rounded-lg border border-white/5 text-[10px] font-medium transition-all cursor-default hover:bg-white/10 hover:text-white"
                                            >
                                                {tag.trim()}
                                                <button
                                                    onClick={() => handleRemoveTag(tag.trim())}
                                                    className="w-3.5 h-3.5 rounded-full hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                                                >
                                                    <X className="w-2 h-2" />
                                                </button>
                                            </span>
                                        );
                                    }) : (
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
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white placeholder:text-gray-700 focus:outline-none focus:border-purple-500/50 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
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
                                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-[11px] font-bold transition-all active:scale-95 ${selectedImage.isFavorite
                                        ? "bg-purple-600/20 border-purple-500/50 text-purple-300"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                                        }`}
                                >
                                    <Heart className={`w-3.5 h-3.5 ${selectedImage.isFavorite ? 'fill-current' : ''}`} />
                                    {selectedImage.isFavorite ? "已收藏" : "加入收藏"}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleReversePrompt();
                                    }}
                                    className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-pink-600 border border-purple-500/50 rounded-xl text-[11px] font-bold text-white hover:from-purple-500 hover:to-pink-500 transition-all active:scale-95 shadow-lg shadow-purple-500/20"
                                >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    圖片反推
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleReuse(selectedImage);
                                    }}
                                    className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-[11px] font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                                >
                                    <Play className="w-3.5 h-3.5" />
                                    重用提示
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleSetAsReference?.(selectedImage);
                                    }}
                                    className="flex items-center justify-center gap-2 py-3 bg-cyan-600/10 border border-cyan-500/30 rounded-xl text-[11px] font-bold text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all active:scale-95"
                                >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    設為參考
                                </button>
                                <a
                                    href={selectedImage.imageUrl || ""}
                                    download={`prompt-db-${selectedImage.id}.png`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-[11px] font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    下載圖片
                                </a>
                            </div>

                            {/* Action Subgroup: Analysis Tools */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-3 bg-purple-600 rounded-full" />
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">AI 專業工具</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={async () => {
                                            setComprehensiveLoading(true);
                                            try {
                                                const base64 = await getBase64(selectedImage.imageUrl!);
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
                                        className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 hover:border-white/20 disabled:opacity-50 text-gray-300 rounded-xl text-[11px] font-medium transition-all hover:bg-white/10 hover:text-white"
                                    >
                                        {comprehensiveLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart3 className="w-3.5 h-3.5" />}
                                        全面評估
                                    </button>
                                    <button
                                        onClick={async () => {
                                            setDeepAnalysisLoading(true);
                                            try {
                                                const base64 = await getBase64(selectedImage.imageUrl!);
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
                                        className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 hover:border-white/20 disabled:opacity-50 text-gray-300 rounded-xl text-[11px] font-medium transition-all hover:bg-white/10 hover:text-white"
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
                                        className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 hover:border-white/20 disabled:opacity-50 text-gray-300 rounded-xl text-[11px] font-medium transition-all hover:bg-white/10 hover:text-white"
                                    >
                                        {structuredLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                                        結構分析
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!selectedImage.imageUrl) return;
                                            setIsRemovingBg(true);
                                            try {
                                                const base64 = await getBase64(selectedImage.imageUrl);
                                                const blob = await (await fetch(selectedImage.imageUrl)).blob();
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
                                                    // 設置預覽,禁止自動下載
                                                    const resultUrl = `data:${data.mimeType};base64,${data.imageBase64}`;
                                                    setRemovedBgPreview(resultUrl);
                                                    showToast('✨ 去背完成,請確認預覽');
                                                }
                                            } catch (err: any) { alert('去背失敗'); } finally { setIsRemovingBg(false); }
                                        }}
                                        disabled={isRemovingBg}
                                        className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 hover:border-white/20 text-gray-300 rounded-xl text-[11px] font-medium transition-all hover:bg-white/10 hover:text-white"
                                    >
                                        {isRemovingBg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scissors className="w-3.5 h-3.5" />}
                                        一鍵去背
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Deep Analysis Result Section */}
                    {deepAnalysis && (
                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-3 bg-cyan-500 rounded-full" />
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">深度分析報告</h4>
                                </div>
                                <button
                                    onClick={() => setDeepAnalysis(null)}
                                    className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
                                >清除結果</button>
                            </div>

                            {/* Composition Details */}
                            {deepAnalysis.composition && (
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                                        <span className="text-xs font-bold text-gray-300">構圖分析</span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[11px] text-gray-400 leading-relaxed">
                                            <span className="text-gray-500">類型：</span>{deepAnalysis.composition.type}
                                        </p>
                                        <p className="text-[11px] text-gray-400 leading-relaxed">
                                            <span className="text-gray-500">焦點：</span>{deepAnalysis.composition.focusPoint}
                                        </p>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {deepAnalysis.composition.elements?.map((el: string, i: number) => (
                                                <span key={i} className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-full text-[9px]">{el}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Style & Mood */}
                            {deepAnalysis.style && (
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Paintbrush className="w-3.5 h-3.5 text-purple-400" />
                                        <span className="text-xs font-bold text-gray-300">風格特徵</span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[11px] text-gray-400 leading-relaxed">
                                            <span className="text-gray-500">藝術風格：</span>{deepAnalysis.style.artStyle}
                                        </p>
                                        <p className="text-[11px] text-gray-400 leading-relaxed">
                                            <span className="text-gray-500">氛圍：</span>{deepAnalysis.style.mood}
                                        </p>
                                        <div className="flex gap-1 mt-2">
                                            {deepAnalysis.style.colorPalette?.map((color: string, i: number) => (
                                                <div
                                                    key={i}
                                                    className="w-4 h-4 rounded-full border border-white/10"
                                                    style={{ backgroundColor: color }}
                                                    title={color}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Modifications / Improvements */}
                            {deepAnalysis.modifications?.length > 0 && (
                                <div className="bg-amber-500/5 rounded-2xl p-4 border border-amber-500/10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                        <span className="text-xs font-bold text-amber-300">AI 改進建議</span>
                                    </div>
                                    <div className="space-y-4">
                                        {deepAnalysis.modifications.map((mod: any, i: number) => (
                                            <div key={i} className="space-y-2">
                                                <div className="text-[10px] p-2 bg-black/30 rounded-lg text-amber-200/70 border-l-2 border-amber-400/50">
                                                    <span className="font-bold">區域：{mod.area}</span>
                                                    <p className="mt-1">{mod.issue}</p>
                                                </div>
                                                <div className="relative group/copy">
                                                    <p className="text-[9px] font-mono text-gray-500 italic bg-black/20 p-2 rounded border border-white/5">
                                                        {mod.prompt}
                                                    </p>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(mod.prompt);
                                                            showToast('已複製建議 Prompt');
                                                        }}
                                                        className="absolute top-1 right-1 p-1 bg-white/5 hover:bg-white/10 rounded opacity-0 group-hover/copy:opacity-100 transition-all"
                                                    >
                                                        <Copy className="w-2.5 h-2.5 text-gray-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Structured Analysis Result Section */}
                    {structuredJson && (
                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">結構化 Prompt 解析</h4>
                                </div>
                                <button
                                    onClick={() => setStructuredJson(null)}
                                    className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
                                >清除結果</button>
                            </div>

                            <div className="bg-indigo-500/5 rounded-2xl border border-indigo-500/10 overflow-hidden divide-y divide-white/5">
                                {/* Subject */}
                                <div className="p-4">
                                    <div className="text-[10px] text-indigo-400 font-bold mb-2 uppercase tracking-tighter">主體主體 {structuredJson.subject?.main_element}</div>
                                    <p className="text-xs text-white leading-relaxed">{structuredJson.subject?.main_element_zh}</p>
                                    {structuredJson.subject?.details_zh?.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {structuredJson.subject.details_zh.map((d: string, i: number) => (
                                                <span key={i} className="text-[9px] text-gray-400 bg-white/5 px-2 py-0.5 rounded">{d}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Environment */}
                                <div className="p-4">
                                    <div className="text-[10px] text-emerald-400 font-bold mb-2 uppercase tracking-tighter">環境環境 {structuredJson.environment?.setting}</div>
                                    <p className="text-xs text-white leading-relaxed">{structuredJson.environment?.setting_zh}</p>
                                </div>

                                {/* Style & Technique */}
                                <div className="p-4">
                                    <div className="text-[10px] text-purple-400 font-bold mb-2 uppercase tracking-tighter">風格技術 STYLE & TECHNIQUE</div>
                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        <div>
                                            <span className="text-[9px] text-gray-500 block">構圖角度</span>
                                            <span className="text-[10px] text-gray-300">{structuredJson.style?.camera_view_zh || '預設'}</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] text-gray-500 block">光線氛圍</span>
                                            <span className="text-[10px] text-gray-300">{structuredJson.style?.lighting_zh || '預設'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Subgroup: Primary Actions */}
                    <div className="pt-6 border-t border-white/5 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => {
                                    if (confirm("確定要刪除嗎？")) {
                                        handleDelete(selectedImage.id);
                                        onClose();
                                    }
                                }}
                                className="flex items-center justify-center gap-2 py-3 px-4 bg-white/5 border border-white/10 hover:bg-red-500/20 hover:text-red-400 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
                            >
                                <Trash2 className="w-4 h-4" />
                                刪除圖片
                            </button>
                            <button
                                onClick={onClose}
                                className="flex items-center justify-center gap-2 py-3 px-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                                關閉視窗
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comprehensive Evaluation Modal */}
            {showEvalModal && comprehensiveEval && (
                <div
                    className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
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
                                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                            title="匯出 Markdown 報告"
                                        >
                                            <Download className="w-5 h-5" />
                                        </button>
                                    </>
                                )}
                                <button onClick={() => setShowEvalModal(false)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-900/50">
                            {comprehensiveEval.error ? (
                                <div className="text-red-400 p-4 bg-red-500/10 rounded-lg">
                                    ❌ 評估失敗：{comprehensiveEval.error}
                                </div>
                            ) : (
                                showSocialPreview ? (
                                    <div className="flex items-center justify-center min-h-[60vh] bg-gray-50/5 rounded-xl p-8">
                                        <SocialPreview
                                            imageUrl={selectedImage.imageUrl || ''}
                                            analysis={comprehensiveEval}
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
                                                                <div className={`text-2xl font-bold bg-gradient-to-r ${dim.color} bg-clip-text text-transparent`}>
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

            {/* Reuse Confirmation Modal */}
            {isReuseConfirmOpen && (
                <div
                    className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setIsReuseConfirmOpen(false)}
                >
                    <div
                        className="bg-gray-900 border border-white/20 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-white/10 shrink-0">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                                圖片反推確認
                            </h2>
                            <button
                                onClick={() => setIsReuseConfirmOpen(false)}
                                className="text-gray-500 hover:text-white text-2xl transition-colors"
                            >×</button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto p-6 space-y-4">
                            {reversePromptLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                                    <p className="text-gray-400 text-sm">🧠 AI 正在分析圖片中...</p>
                                </div>
                            ) : reversePromptResult ? (
                                <>
                                    <p className="text-gray-400 text-sm mb-4">
                                        確認要將以下 AI 反推的提示詞填入主輸入框嗎？
                                    </p>

                                    {/* English Prompt */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">English Prompt</span>
                                            <div className="flex-1 h-px bg-white/10"></div>
                                        </div>
                                        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                                            <p className="text-gray-300 text-sm leading-relaxed">
                                                {reversePromptResult.en}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Chinese Prompt */}
                                    {reversePromptResult.zh && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">中文描述</span>
                                                <div className="flex-1 h-px bg-white/10"></div>
                                            </div>
                                            <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                                                <p className="text-white/90 text-sm leading-relaxed">
                                                    {reversePromptResult.zh}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex items-center justify-center py-12">
                                    <p className="text-gray-500 text-sm">載入中...</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Buttons */}
                        <div className="p-4 border-t border-white/10 flex gap-3 shrink-0">
                            <button
                                onClick={() => {
                                    setIsReuseConfirmOpen(false);
                                    setReversePromptResult(null);
                                }}
                                className="flex-1 py-3 px-4 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-sm font-bold transition-all"
                                disabled={reversePromptLoading}
                            >
                                ❌ 取消
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSaveAndReuse();
                                }}
                                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={reversePromptLoading || !reversePromptResult}
                            >
                                ✅ 存入置換
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
