"use client";

import { useState, useEffect, useRef } from "react";
import { X, Copy, User, Users, Loader2, Sparkles, Globe, Undo2, Beaker, MoreHorizontal, Wand2, Languages } from "lucide-react";
import { DropdownMenu, DropdownItem, DropdownDivider } from "./ui/DropdownMenu";
import { Button } from "./ui/Button";
import CharacterManager from "./CharacterManager";
import { ASPECT_RATIOS, TemplateCategory } from "@/lib/prompt-data";
import { LOGIC_PREFIX, QUALITY_SUFFIX_BASE, SCENE_PROFILES, applyUltimateMasterFilter } from "@/lib/prompt-logic";

// Sub-components
import SettingsPanel from "./form/SettingsPanel";
import TemplateSelector from "./form/TemplateSelector";
import ImagePreviewModal from "./form/ImagePreviewModal";
import ProviderSelector from "./form/ProviderSelector";
import AlchemistLabModal from "./AlchemistLabModal";

interface PromptFormProps {
    onSuccess: () => void;
    initialData?: any; // Accepting reuse data
}

export default function PromptForm({ onSuccess, initialData }: PromptFormProps) {
    const [loading, setLoading] = useState(false);
    const [showApiSettings, setShowApiSettings] = useState(false);
    const [useMagicEnhancer, setUseMagicEnhancer] = useState(false);
    const [useSearch, setUseSearch] = useState(false);

    // Alchemist Lab State
    const [isAlchemistOpen, setIsAlchemistOpen] = useState(false);
    const [activePersonaId, setActivePersonaId] = useState<string | null>(null);

    // Template Selector State
    const [isTemplateOpen, setIsTemplateOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<TemplateCategory>("Commercial");
    const [lastEnhancedPrompt, setLastEnhancedPrompt] = useState("");
    const [isLastResultEnhanced, setIsLastResultEnhanced] = useState(false);

    const [imageCount, setImageCount] = useState(1);

    // [NEW] Quota Stats
    const [quotaStats, setQuotaStats] = useState<{ dailyCount: number; dailyLimit: number; resetTime?: string } | null>(null);

    const fetchQuotaStats = async () => {
        try {
            const res = await fetch('/api/stats');
            if (res.ok) {
                const data = await res.json();
                setQuotaStats(data);
            }
        } catch (e) {
            console.error("Failed to fetch quota stats", e);
        }
    };

    useEffect(() => {
        fetchQuotaStats();
    }, []);
    const [imageEngine, setImageEngine] = useState<'flash' | 'pro' | 'imagen'>("flash");
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [previewData, setPreviewData] = useState<any>(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    // Character DNA State

    const [showCharManager, setShowCharManager] = useState(false);

    // Prompt Queue State (for batch variations)
    const [promptQueue, setPromptQueue] = useState<string[]>([]);

    // Reference Image State (for Img2Img)
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [referenceMode, setReferenceMode] = useState<'preserve' | 'subject' | '3d'>('subject'); // 'preserve' = Lock Composition, 'subject' = Only Subject, '3d' = 2D to 3D Evolution

    // Flash Suggest State
    const [suggestion, setSuggestion] = useState("");
    const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Template Usage Statistics
    const [templateStats, setTemplateStats] = useState<Record<string, number>>({});

    // Track template usage
    const trackTemplateUsage = (templateName: string) => {
        const stored = localStorage.getItem('templateStats');
        const stats: Record<string, number> = stored ? JSON.parse(stored) : {};
        stats[templateName] = (stats[templateName] || 0) + 1;
        localStorage.setItem('templateStats', JSON.stringify(stats));
        setTemplateStats(stats);
    };

    // Load saved characters from localStorage on mount

    // Load prompt queue & stats
    useEffect(() => {
        const queueStr = localStorage.getItem('promptQueue');
        if (queueStr) {
            try {
                setPromptQueue(JSON.parse(queueStr));
            } catch (e) {
                console.error('Failed to load queue', e);
            }
        }

        const statsStr = localStorage.getItem('templateStats');
        if (statsStr) {
            try {
                setTemplateStats(JSON.parse(statsStr));
            } catch (e) {
                console.error('Failed to load template stats', e);
            }
        }

        const checkQueue = () => {
            const currentQueueStr = localStorage.getItem('promptQueue');
            if (currentQueueStr) {
                try {
                    const parsedQueue = JSON.parse(currentQueueStr);
                    setPromptQueue(prev => {
                        if (JSON.stringify(prev) !== JSON.stringify(parsedQueue)) {
                            return parsedQueue;
                        }
                        return prev;
                    });
                } catch (e) { }
            } else {
                setPromptQueue(prev => prev.length > 0 ? [] : prev);
            }
        };

        const interval = setInterval(checkQueue, 500);
        return () => clearInterval(interval);
    }, []);



    // Default State

    // Default State
    const defaultState = {
        prompt: "",
        negativePrompt: "",
        width: 1024,
        height: 1024,
        steps: 25,
        cfgScale: 7.0,
        seed: -1,
        provider: "mock",
        apiUrl: "",
        apiKey: "",
    };

    const [formData, setFormData] = useState(defaultState);

    // Load API key from localStorage on mount
    useEffect(() => {
        const savedApiKey = localStorage.getItem('geminiApiKey');
        if (savedApiKey) {
            setFormData(prev => ({ ...prev, apiKey: savedApiKey }));
        }
    }, []);

    // Helper to fetch and convert image to base64
    const getBase64 = async (url: string): Promise<string> => {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    // Effect to populate form when initialData changes (Redraw action)
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                prompt: initialData.prompt,
                negativePrompt: initialData.negativePrompt || "",
                width: initialData.width || 1024,
                height: initialData.height || 1024,
                steps: initialData.steps || 25,
                cfgScale: initialData.cfgScale || 7.0,
                seed: initialData.seed || -1,
                // Keep provider settings as is
            }));

            // Handle reference image if provided
            if (initialData.imageUrl) {
                getBase64(initialData.imageUrl)
                    .then(base64 => {
                        setReferenceImage(base64);
                        setReferenceMode('subject'); // Default to subject mode for reuse
                    })
                    .catch(err => console.error('Failed to load initial reference image', err));
            }

            // Smart Magic Detection (Updated for Ultimate Logic v2)
            if (initialData.prompt.includes(LOGIC_PREFIX.trim()) || initialData.prompt.includes("Analyze the core emotion")) {
                setUseMagicEnhancer(true);

                // Aggressively strip known components to return to clean user prompt
                let cleanPrompt = initialData.prompt
                    .replace(LOGIC_PREFIX, "")
                    .replace(QUALITY_SUFFIX_BASE, "")
                    .trim();

                // Strip all scene profiles (lens, lighting, style)
                for (const profile of Object.values(SCENE_PROFILES)) {
                    cleanPrompt = cleanPrompt
                        .replace(profile.lens, "")
                        .replace(profile.lighting, "")
                        .replace(profile.style, "");
                }

                // Final cleanup of leftover commas/dots
                cleanPrompt = cleanPrompt.replace(/^,/, "").replace(/,$/, "").replace(/,\s*,/g, ",").trim();

                // Fallback regex cleanup for any remnants
                cleanPrompt = cleanPrompt.replace(/Analyze the core emotion[\s\S]*?fidelity\./, "").trim();
                cleanPrompt = cleanPrompt.replace(/Masterpiece[\s\S]*?photography\./, "").trim();
                cleanPrompt = cleanPrompt.replace(/\d+mm[^,]*aperture/gi, "").trim();

                setFormData(prev => ({ ...prev, prompt: cleanPrompt }));
            } else {
                setUseMagicEnhancer(false);
            }

            // Optionally scroll to top smoothly
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [initialData]);

    const [errorMsg, setErrorMsg] = useState("");
    const [previousPrompt, setPreviousPrompt] = useState<string | null>(null);

    // Download image helper
    const downloadImage = async (imageUrl: string, index: number) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `image-${Date.now()}-${index + 1}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
        }
    };

    // Save selected image to gallery
    const saveToGallery = async (imageUrl: string) => {
        if (!previewData) return;
        setLoading(true);
        try {
            const res = await fetch("/api/prompts", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageUrl,
                    prompt: previewData.prompt,
                    originalPrompt: previewData.originalPrompt,
                    promptZh: previewData.promptZh,
                    negativePrompt: previewData.negativePrompt,
                    width: previewData.width,
                    height: previewData.height,
                    seed: previewData.seed,
                    cfgScale: previewData.cfgScale,
                    steps: previewData.steps,
                    tags: previewData.tags
                }),
            });
            if (!res.ok) throw new Error("Failed to save");
            setIsPreviewMode(false);
            setPreviewImages([]);
            setPreviewData(null);
            onSuccess();
        } catch (error: any) {
            setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Cancel preview mode
    const cancelPreview = () => {
        setIsPreviewMode(false);
        setPreviewImages([]);
        setPreviewData(null);
    };

    const handleBananaProSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setImageEngine("pro");
        setUseMagicEnhancer(true);

        // Use a timeout to ensure state updates (though React might batch them)
        // or just pass the values directly in a helper.
        // For simplicity, I'll call a shared generation function or just wait a tick.
        setTimeout(() => {
            const submitBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
            if (submitBtn) submitBtn.click();
        }, 100);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");
        try {
            const payload = {
                ...formData,
                prompt: formData.prompt,
                imageCount: imageEngine === "imagen" ? imageCount : 1,
                imageEngine,
                previewMode: imageEngine === "imagen" && imageCount > 1,
                useSearch: useSearch,
                useMagicEnhance: useMagicEnhancer, // 修正為 useMagicEnhancer
                personaId: activePersonaId, // [NEW] Pass custom persona ID
                // Add reference image if exists
                imageBase64: referenceImage,
                strength: referenceMode === 'preserve' ? 30 : (referenceMode === '3d' ? 80 : 50),
                style: referenceMode === 'preserve' ? 'preserve' : (referenceMode === '3d' ? '3d' : 'transform')
            };

            const res = await fetch("/api/prompts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error(await res.text() || "Generation Failed");
            }

            const data = await res.json();

            // Store enhancement info for display
            if (data.usedPrompt) {
                setLastEnhancedPrompt(data.usedPrompt);
                setIsLastResultEnhanced(!!data.isEnhanced);
            } else {
                setLastEnhancedPrompt("");
                setIsLastResultEnhanced(false);
            }

            // Check if preview mode response
            if (data.previewMode && data.images?.length > 0) {
                setPreviewImages(data.images);
                setPreviewData(data);
                setIsPreviewMode(true);
            } else if (data.storyboard) {
                // [NEW] Storyboard Mode Success
                // setLastEnhancedPrompt("Storyboard Sequence Generated"); // Optional feedback
                // Show a brief toast or alert if needed, or just let the gallery refresh handle it.
                // For now, let's trust the refresh.
                onSuccess();
                setReferenceImage(null);
                fetchQuotaStats();
            } else {
                // Success: entry was created or returned
                onSuccess();
                // Clear reference image after success
                setReferenceImage(null);
                // Update stats
                fetchQuotaStats();
            }
        } catch (error: any) {
            console.error(error);
            let displayError = error.message;
            let isJson = false;

            try {
                const jsonErr = JSON.parse(error.message);
                displayError = jsonErr.details || jsonErr.error || error.message;
                isJson = true;
            } catch (e) {
                // Not JSON or fail to parse
            }

            if (displayError.includes("Quota Exceeded") || displayError.includes("429")) {
                // Enhanced 429 Alert
                const resetTime = quotaStats?.resetTime || "Tomorrow";
                window.alert(`🚨 今日額度已耗盡！\n\nGoogle Gemini/Imagen API 每日限制 70 次生圖。\n\n請於 ${resetTime} 後再次嘗試，或暫時切換至 Mock 模式。`);
            } else {
                // [NEW] General AI Failure Popup
                window.alert(`❌ 生圖失敗\n\n理由：${displayError}`);
            }

            setErrorMsg(displayError);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        // Save API key to localStorage for use by Gallery features
        if (name === 'apiKey') {
            localStorage.setItem('geminiApiKey', value);
        }

        setFormData((prev) => ({
            ...prev,
            [name]:
                name === "width" ||
                    name === "height" ||
                    name === "steps" ||
                    name === "cfgScale" ||
                    name === "seed"
                    ? Number(value)
                    : value,
        }));

        // Flash Suggest Logic
        if (name === "prompt") {
            setSuggestion(""); // Clear old suggestion immediately
            if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);

            if (value.length >= 5) {
                suggestionTimeoutRef.current = setTimeout(async () => {
                    try {
                        const res = await fetch("/api/suggest", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ prompt: value, apiKey: formData.apiKey })
                        });
                        const data = await res.json();
                        if (data.suggestion) {
                            setSuggestion(data.suggestion);
                        }
                    } catch (e) {
                        console.error("Flash Suggest Error:", e);
                    }
                }, 800); // 800ms debounce
            }
        }
    };

    const handleRatioSelect = (width: number, height: number) => {
        setFormData((prev) => ({ ...prev, width, height }));
    };

    return (
        <form
            id="prompt-form-section"
            onSubmit={handleSubmit}
            className="relative w-full max-w-4xl bg-gradient-to-br from-amber-900/20 via-yellow-900/10 to-orange-900/15 backdrop-blur-xl border-2 border-amber-700/40 rounded-2xl p-8 shadow-[0_8px_60px_rgba(139,69,19,0.3),inset_0_1px_0_rgba(212,175,55,0.1)] space-y-6 overflow-hidden group/form"
        >
            {/* Error Message */}
            {errorMsg && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm animate-in fade-in">
                    ❌ 錯誤: {errorMsg}
                </div>
            )}

            {/* Extracted Settings Panel */}
            <SettingsPanel
                formData={formData}
                showApiSettings={showApiSettings}
                setShowApiSettings={setShowApiSettings}
                handleChange={handleChange}
                handleReset={() => {
                    if (window.confirm("確定要重置所有設定嗎？")) {
                        setFormData(defaultState);
                        setUseMagicEnhancer(false);
                        setUseSearch(false);
                        setImageCount(1);
                        setImageEngine("flash");
                        setReferenceImage(null);
                        setReferenceMode('subject');
                        setPreviewImages([]);
                        setPreviewData(null);
                        setIsPreviewMode(false);
                        setErrorMsg("");
                        setPreviousPrompt(null);
                        setSuggestion("");
                        setActiveCategory("Commercial");
                    }
                }}
            />

            {/* Extracted Template Selector */}
            <TemplateSelector
                isOpen={isTemplateOpen}
                setIsOpen={setIsTemplateOpen}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                onSelect={(prompt, name) => {
                    setFormData(prev => ({ ...prev, prompt }));
                    trackTemplateUsage(name);
                    setIsTemplateOpen(false);
                }}
                usageStats={templateStats}
            />

            <AlchemistLabModal
                isOpen={isAlchemistOpen}
                onClose={() => setIsAlchemistOpen(false)}
                currentPersonaId={activePersonaId || undefined}
                onSelectPersona={(id) => setActivePersonaId(id)}
            />

            <div className="space-y-2">
                <div className="flex flex-wrap justify-between items-center gap-2">
                    <label className="text-xs md:text-sm font-medium text-purple-200">正向提示詞 (Prompt)</label>

                    {/* Primary Actions: Magic Enhancer Toggle */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setUseMagicEnhancer(!useMagicEnhancer)}
                            className={`text-xs flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 ${useMagicEnhancer
                                ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 text-yellow-200 shadow-[0_0_15px_rgba(234,179,8,0.2)] font-bold"
                                : "bg-white/5 text-gray-400 border-white/10 hover:border-white/30"
                                }`}
                        >
                            <Sparkles className={`w-3.5 h-3.5 ${useMagicEnhancer ? "animate-pulse text-yellow-400" : ""}`} />
                            {useMagicEnhancer ? "✨ 煉金術 ON" : "🪄 煉金術"}
                        </button>

                        {/* Alchemist Lab Trigger */}
                        {useMagicEnhancer && (
                            <button
                                type="button"
                                onClick={() => setIsAlchemistOpen(true)}
                                className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500 hover:text-white transition-all animate-in zoom-in-50"
                                title="配置煉金術師人格"
                            >
                                <Beaker className="w-3 h-3" />
                                {activePersonaId ? "🎭 人格" : "🧪 實驗室"}
                            </button>
                        )}

                        {/* Smart Search Toggle (quick access since commonly used) */}
                        <button
                            type="button"
                            onClick={() => setUseSearch(!useSearch)}
                            className={`text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-all ${useSearch
                                ? "bg-blue-500 text-white border-blue-400 font-bold shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                                : "bg-white/5 text-gray-400 border-white/10 hover:border-white/30"
                                }`}
                            title="啟用智慧聯網"
                        >
                            <Globe className={`w-3.5 h-3.5 ${useSearch ? 'animate-pulse' : ''}`} />
                            {useSearch ? "🌐" : ""}
                        </button>

                        {/* Secondary Actions: Dropdown Menu */}
                        <DropdownMenu
                            trigger={
                                <button
                                    type="button"
                                    className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl border border-white/10 transition-all"
                                    title="更多工具"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            }
                            align="right"
                        >
                            <DropdownItem
                                icon={<Wand2 className="w-4 h-4" />}
                                disabled={loading || !formData.prompt.trim()}
                                onClick={async () => {
                                    if (!formData.prompt.trim()) return;
                                    setPreviousPrompt(formData.prompt);
                                    setLoading(true);
                                    try {
                                        const res = await fetch("/api/enhance", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ prompt: formData.prompt, apiKey: formData.apiKey }),
                                        });
                                        if (!res.ok) throw new Error(await res.text());
                                        const data = await res.json();
                                        if (data.enhanced) setFormData(prev => ({ ...prev, prompt: data.enhanced }));
                                    } catch (err: any) {
                                        setErrorMsg(err.message || "AI 優化失敗");
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                            >
                                AI 擴寫
                            </DropdownItem>
                            <DropdownItem
                                icon={<Languages className="w-4 h-4" />}
                                disabled={loading || !formData.prompt.trim()}
                                onClick={async () => {
                                    if (!formData.prompt.trim()) return;
                                    setLoading(true);
                                    try {
                                        const res = await fetch("/api/translate", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ text: formData.prompt, apiKey: formData.apiKey }),
                                        });
                                        if (!res.ok) throw new Error(await res.text());
                                        const data = await res.json();
                                        if (data.translated) setFormData(prev => ({ ...prev, prompt: data.translated }));
                                    } catch (err: any) {
                                        setErrorMsg(err.message || "翻譯失敗");
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                            >
                                中翻英
                            </DropdownItem>
                            <DropdownDivider />
                            {previousPrompt && (
                                <DropdownItem
                                    icon={<Undo2 className="w-4 h-4" />}
                                    onClick={() => {
                                        setFormData(prev => ({ ...prev, prompt: previousPrompt }));
                                        setPreviousPrompt(null);
                                    }}
                                >
                                    復原上一步
                                </DropdownItem>
                            )}
                        </DropdownMenu>

                        {/* Queue Buttons - shows when there are queued prompts */}
                        {promptQueue.length > 0 && (
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const [nextPrompt, ...rest] = promptQueue;
                                        if (nextPrompt) {
                                            setFormData(prev => ({ ...prev, prompt: nextPrompt }));
                                            setPromptQueue(rest);
                                            localStorage.setItem('promptQueue', JSON.stringify(rest));
                                        }
                                    }}
                                    className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border bg-orange-500/20 text-orange-200 border-orange-500/30 hover:bg-orange-500 hover:text-white transition-all"
                                    title="載入下一個 Prompt"
                                >
                                    📋 {promptQueue.length}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPromptQueue([]);
                                        localStorage.removeItem('promptQueue');
                                    }}
                                    className="p-1.5 rounded-full bg-red-500/10 text-red-300 hover:bg-red-500 hover:text-white transition-all"
                                    title="清除佇列"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Magic Reverse Prompt Area */}
                <div className="space-y-3">
                    <div className="relative group">
                        {/* Shadow suggestion layer */}
                        {suggestion && (
                            <div
                                className="absolute inset-0 p-4 pt-[17px] pointer-events-none text-white/20 whitespace-pre-wrap break-words text-sm overflow-hidden"
                                aria-hidden="true"
                            >
                                <span className="invisible">{formData.prompt}</span>
                                <span>{suggestion}</span>
                                <span className="ml-2 inline-flex items-center text-[10px] bg-white/10 px-1 rounded animate-pulse">Tab to accept</span>
                            </div>
                        )}
                        <textarea
                            name="prompt"
                            required
                            rows={4}
                            value={formData.prompt}
                            onChange={handleChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Tab' && suggestion) {
                                    e.preventDefault();
                                    setFormData(prev => ({ ...prev, prompt: prev.prompt + suggestion }));
                                    setSuggestion("");
                                }
                            }}
                            placeholder="描述您想生成的畫面..."
                            className="w-full bg-black/40 border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none relative z-10"
                        />

                        {/* Reference Image Preview Area */}
                        {referenceImage && (
                            <div className="absolute bottom-4 left-4 z-20 flex gap-3 animate-in zoom-in-95 fade-in duration-200">
                                <div className="relative group/ref">
                                    <div className="absolute -top-2 -right-2 z-30 opacity-0 group-hover/ref:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => setReferenceImage(null)}
                                            className="p-1 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="w-16 h-16 rounded-lg border-2 border-purple-500/50 overflow-hidden shadow-xl bg-black">
                                        <img
                                            src={referenceImage}
                                            alt="Reference"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-purple-500/10 mix-blend-overlay" />
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center gap-1.5 min-w-[100px]">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (referenceMode === 'preserve') setReferenceMode('subject');
                                            else if (referenceMode === 'subject') setReferenceMode('3d');
                                            else setReferenceMode('preserve');
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border flex items-center justify-center gap-1.5 ${referenceMode === 'preserve'
                                            ? "bg-amber-500 text-black border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                                            : referenceMode === '3d'
                                                ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-white border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.5)] scale-105"
                                                : "bg-purple-600/80 text-white border-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                                            }`}
                                    >
                                        {referenceMode === 'preserve' && <span className="text-[12px]">🔒</span>}
                                        {referenceMode === '3d' && <span className="text-[12px]">💎</span>}
                                        {referenceMode === 'subject' && <span className="text-[12px]">🎨</span>}
                                        {referenceMode === 'preserve' ? "鎖定構圖" : referenceMode === '3d' ? "3D 進化" : "參考主體"}
                                    </button>
                                    <div className={`text-[9px] px-2 py-0.5 rounded-full text-center font-medium ${referenceMode === '3d' ? "bg-cyan-500/20 text-cyan-300 animate-pulse" : "bg-black/20 text-gray-400"
                                        }`}>
                                        {referenceMode === 'preserve' ? "適合局部更換" : referenceMode === '3d' ? "✨ 2D 轉 3D 渲染" : "適合矩陣/換背景"}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 工具列遷移至外部右下角，確保按鈕獨立且佈局清晰 */}
                    <div className="flex justify-end items-center gap-1.5 px-1 py-1">
                        <input
                            type="file"
                            id="magic-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 20 * 1024 * 1024) {
                                    alert("圖片太大，請小於 20MB");
                                    return;
                                }
                                e.target.value = "";
                                setLoading(true);
                                try {
                                    const reader = new FileReader();
                                    reader.onloadend = async () => {
                                        const base64 = reader.result as string;
                                        const res = await fetch("/api/describe", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                image: base64,
                                                apiKey: formData.apiKey
                                            }),
                                        });
                                        if (!res.ok) throw new Error(await res.text());
                                        const data = await res.json();
                                        if (data.prompt) {
                                            setFormData(prev => ({ ...prev, prompt: data.prompt }));
                                        }
                                        // 關鍵變動：同時保留為參考圖
                                        setReferenceImage(base64);
                                    };
                                    reader.readAsDataURL(file);
                                } catch (err: any) {
                                    setErrorMsg(err.message || "圖片分析失敗");
                                } finally {
                                    setLoading(false);
                                }
                            }}
                        />


                        {/* Clear Button */}
                        {formData.prompt && (
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, prompt: '' }))}
                                className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-xl transition-all backdrop-blur-md border border-white/5"
                                title="清空提示詞"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}

                        {/* Copy Prompt Button */}
                        {formData.prompt && (
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        if (navigator.clipboard && window.isSecureContext) {
                                            await navigator.clipboard.writeText(formData.prompt);
                                        } else {
                                            const textArea = document.createElement("textarea");
                                            textArea.value = formData.prompt;
                                            textArea.style.position = "fixed";
                                            textArea.style.left = "-999999px";
                                            document.body.appendChild(textArea);
                                            textArea.select();
                                            document.execCommand("copy");
                                            textArea.remove();
                                        }
                                        alert("已複製 Prompt！");
                                    } catch (err) {
                                        alert("複製失敗，請手動選取複製");
                                    }
                                }}
                                className="p-2 bg-white/5 hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-400 rounded-xl transition-all backdrop-blur-md border border-white/5"
                                title="複製 Prompt"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => document.getElementById('magic-upload')?.click()}
                            className={`p-2 rounded-xl transition-all backdrop-blur-md border border-white/5 group relative ${referenceImage ? 'bg-purple-600/50 text-white border-purple-500/50' : 'bg-white/5 text-gray-400 hover:bg-purple-500/20 hover:text-purple-400'}`}
                            title="上傳圖片作為參考 (同時反推 Prompt)"
                        >
                            {referenceImage ? (
                                <Sparkles className="w-4 h-4 animate-pulse" />
                            ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            )}
                            <span className="absolute -top-10 right-0 w-max px-2 py-1 bg-black text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                {referenceImage ? "🖼️ 已設為參考圖" : "🖼️ 上傳參考圖"}
                            </span>
                        </button>



                        <button
                            type="button"
                            onClick={() => setShowCharManager(true)}
                            className="ml-1 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/30 flex items-center gap-2 px-3 text-[10px] font-bold"
                            title="角色庫"
                        >
                            <Users className="w-3.5 h-3.5" />
                            角色庫
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-red-200">負向提示詞 (Negative Prompt)</label>
                <textarea
                    name="negativePrompt"
                    rows={2}
                    value={formData.negativePrompt}
                    onChange={handleChange}
                    placeholder="描述您不想看到的元素..."
                    className="w-full bg-black/40 border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none"
                />
            </div>


            <div className="space-y-4">
                <label className="text-xs text-gray-400 block">圖片比例 (Aspect Ratio)</label>
                <div className="grid grid-cols-5 gap-2">
                    {ASPECT_RATIOS.map((ratio) => (
                        <button
                            key={ratio.label}
                            type="button"
                            onClick={() => handleRatioSelect(ratio.width, ratio.height)}
                            className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${formData.width === ratio.width && formData.height === ratio.height
                                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            {ratio.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Advanced parameters hidden - not used by Google Imagen */}
            {/* These would only be relevant for Stable Diffusion WebUI */}
            {formData.provider === "sd" && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                    <div className="space-y-1">
                        <label className="text-xs text-gray-400">採樣步數 (Steps)</label>
                        <input
                            type="number"
                            name="steps"
                            value={formData.steps}
                            onChange={handleChange}
                            className="w-full bg-black/40 border-white/10 rounded-lg p-2 text-sm text-center"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs text-gray-400">提示詞相關性 (CFG)</label>
                        <input
                            type="number"
                            name="cfgScale"
                            step="0.1"
                            value={formData.cfgScale}
                            onChange={handleChange}
                            className="w-full bg-black/40 border-white/10 rounded-lg p-2 text-sm text-center"
                        />
                    </div>
                    <div className="space-y-1 col-span-2">
                        <label className="text-xs text-gray-400">種子碼 (Seed, -1 為隨機)</label>
                        <input
                            type="number"
                            name="seed"
                            value={formData.seed}
                            onChange={handleChange}
                            className="w-full bg-black/40 border-white/10 rounded-lg p-2 text-sm text-center"
                        />
                    </div>
                </div>
            )}

            {/* Extracted Provider Selector */}
            <ProviderSelector
                imageEngine={imageEngine}
                setImageEngine={setImageEngine}
                imageCount={imageCount}
                setImageCount={setImageCount}
                useSearch={useSearch}
            />

            {/* Extracted Image Preview Modal */}
            {isPreviewMode && previewImages.length > 0 && (
                <ImagePreviewModal
                    images={previewImages}
                    data={previewData}
                    onClose={cancelPreview}
                    onSave={saveToGallery}
                    onDownload={downloadImage}
                    loading={loading}
                    lastEnhancedPrompt={lastEnhancedPrompt}
                    isLastResultEnhanced={isLastResultEnhanced}
                />
            )}

            {/* Quota Badge */}
            {quotaStats && (
                <div className="flex justify-between items-center px-1 text-xs font-medium bg-white/5 rounded-lg p-2 mb-2 border border-white/5">
                    <span className="text-gray-400">今日額度 (Daily Quota)</span>
                    <div className={`flex items-center gap-2 ${quotaStats.dailyCount >= quotaStats.dailyLimit ? 'text-red-400' : 'text-cyan-400'}`}>
                        <span>{quotaStats.dailyCount} / {quotaStats.dailyLimit}</span>
                        {quotaStats.dailyCount >= quotaStats.dailyLimit && <span>(已滿)</span>}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-lg text-white shadow-lg hover:shadow-cyan-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading && imageEngine !== 'pro' ? (
                        <>
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {useSearch ? "AI 分析與聯網中..." : "生成中..."}
                        </>
                    ) : (
                        <>🎨 開始生圖 (Generate)</>
                    )}
                </button>

                <button
                    type="button"
                    onClick={handleBananaProSubmit}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-purple-600 rounded-xl font-bold text-lg text-white shadow-xl hover:shadow-orange-500/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-white/20"
                >
                    {loading && imageEngine === 'pro' && useMagicEnhancer ? (
                        <>
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>🍌 Banana Pro 思考中...</span>
                        </>
                    ) : (
                        <>🍌 Banana Pro (100% Web 版)</>
                    )}
                </button>
            </div>

            <CharacterManager
                isOpen={showCharManager}
                onClose={() => setShowCharManager(false)}
                onSelect={(char) => {
                    setFormData(prev => ({
                        ...prev,
                        prompt: char.basePrompt + (prev.prompt ? ", " + prev.prompt : ""),
                        seed: (char.seed !== null && char.seed !== -1) ? char.seed : prev.seed
                    }));
                    setShowCharManager(false);
                }}
            />
        </form>
    );
}
