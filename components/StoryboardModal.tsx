"use client";

import { useState, useEffect } from "react";

interface Character {
    id: string;
    name: string;
    description: string;
    basePrompt: string;
    avatarUrl?: string;
}

interface StoryboardModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Frame = {
    id: number;
    prompt: string;
    imageUrl: string | null;
    loading: boolean;
};

export default function StoryboardModal({ isOpen, onClose }: StoryboardModalProps) {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectedCharId, setSelectedCharId] = useState<string>("");
    const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16">("1:1");

    // 4 Frames
    const [frames, setFrames] = useState<Frame[]>([
        { id: 1, prompt: "", imageUrl: null, loading: false },
        { id: 2, prompt: "", imageUrl: null, loading: false },
        { id: 3, prompt: "", imageUrl: null, loading: false },
        { id: 4, prompt: "", imageUrl: null, loading: false },
    ]);

    const [isGenerating, setIsGenerating] = useState(false);
    const [storyAnalysis, setStoryAnalysis] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Load characters
    useEffect(() => {
        if (isOpen) {
            fetch("/api/characters")
                .then(res => res.json())
                .then(data => {
                    setCharacters(data);
                    if (data.length > 0 && !selectedCharId) {
                        setSelectedCharId(data[0].id);
                    }
                })
                .catch(err => console.error("Failed to load characters", err));
        }
    }, [isOpen]);

    const handleGenerate = async () => {
        const char = characters.find(c => c.id === selectedCharId);
        if (!char) {
            alert("請先選擇主角");
            return;
        }

        setIsGenerating(true);

        // Process frames one by one (or parallel depending on preference, here we do sequential for stability)
        // Actually, let's do parallel 2x2 to speed it up
        const promises = frames.map(async (frame) => {
            if (!frame.prompt.trim()) return frame; // Skip empty prompts

            // Create prompt
            const fullPrompt = `${char.basePrompt}, ${frame.prompt}. Comic book style, consistent character features.`;

            // Set loading state for this frame
            setFrames(prev => prev.map(f => f.id === frame.id ? { ...f, loading: true } : f));

            try {
                // Determine size
                let width = 1024;
                let height = 1024;
                if (aspectRatio === "16:9") { width = 1216; height = 684; }
                if (aspectRatio === "9:16") { width = 684; height = 1216; }

                const res = await fetch("/api/prompts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: fullPrompt,
                        width,
                        height,
                        steps: 25,
                        cfgScale: 7.0,
                        provider: "gemini", // defaulting to gemini/imagen
                        apiKey: localStorage.getItem("geminiApiKey") || ""
                    }),
                });

                if (!res.ok) throw new Error("Generation failed");
                const data = await res.json();

                // Return updated frame
                return { ...frame, imageUrl: data.imageUrl, loading: false };
            } catch (error) {
                console.error(`Frame ${frame.id} failed`, error);
                return { ...frame, loading: false };
            }
        });

        // Wait for all
        const results = await Promise.all(promises);
        setFrames(results);
        setIsGenerating(false);
    };

    const handleAnalyzeConsistency = async () => {
        const imagesWithContent = frames.filter(f => f.imageUrl);
        if (imagesWithContent.length < 2) {
            alert("請先生成至少兩張圖片再進行連貫性分析");
            return;
        }

        setIsAnalyzing(true);
        setStoryAnalysis(null);

        try {
            const imagesBase64 = await Promise.all(imagesWithContent.map(async (f) => {
                const res = await fetch(f.imageUrl!);
                const blob = await res.blob();
                return new Promise<{ base64: string, mimeType: string }>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve({
                            base64: reader.result as string,
                            mimeType: blob.type
                        });
                    };
                    reader.readAsDataURL(blob);
                });
            }));

            const res = await fetch("/api/storyboard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    images: imagesBase64,
                    apiKey: localStorage.getItem("geminiApiKey") || ""
                })
            });

            if (!res.ok) throw new Error("Analysis failed");
            const data = await res.json();
            setStoryAnalysis(data);
        } catch (error: any) {
            console.error("Story Analysis Error:", error);
            alert("分析失敗：" + error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDownloadAll = () => {
        // TBD: Could zip them or canvas merge
        alert("功能開發中：將來可以下載拼貼好的大圖！目前請個別下載。");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-[#1A1206]/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#1A1206] border-2 border-amber-700/40 shadow-[0_8px_60px_rgba(139,69,19,0.4)] rounded-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden" onClick={e => e.stopPropagation()}>

                {/* Left Sidebar: Controls */}
                <div className="w-80 bg-[#1A1206]/80 border-r border-amber-700/30 p-6 flex flex-col gap-6 overflow-y-auto">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">🎬 AI 故事板</h2>
                        <p className="text-xs text-gray-400">連貫分鏡生成工具</p>
                    </div>

                    {/* Character Select */}
                    <div>
                        <label className="text-xs font-medium text-gray-400 mb-2 block">1. 選擇主角 (確保一致性)</label>
                        <select
                            value={selectedCharId}
                            onChange={(e) => setSelectedCharId(e.target.value)}
                            className="w-full bg-black/40 border border-white/20 rounded-lg p-2 text-white text-sm"
                        >
                            <option value="">-- 選擇角色 --</option>
                            {characters.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-gray-500 mt-1">還沒有角色？去 Prompt Form 存一個！</p>
                    </div>

                    {/* Ratio */}
                    <div>
                        <label className="text-xs font-medium text-gray-400 mb-2 block">2. 畫幅比例</label>
                        <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                            {["1:1", "16:9", "9:16"].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setAspectRatio(r as any)}
                                    className={`flex-1 py-1.5 text-xs rounded transition-colors ${aspectRatio === r ? "bg-amber-600/50 text-white" : "text-gray-400 hover:text-white"}`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Frame Inputs */}
                    <div className="flex-1 space-y-4">
                        <label className="text-xs font-medium text-gray-400 block">3. 輸入分鏡劇情</label>
                        {frames.map((frame) => (
                            <div key={frame.id} className="space-y-1">
                                <span className="text-xs text-purple-300">Frame {frame.id}</span>
                                <textarea
                                    value={frame.prompt}
                                    onChange={(e) => {
                                        const newFrames = [...frames];
                                        newFrames[frame.id - 1].prompt = e.target.value;
                                        setFrames(newFrames);
                                    }}
                                    placeholder={`第 ${frame.id} 格發生了什麼事？`}
                                    className="w-full h-16 bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500 resize-none"
                                />
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || isAnalyzing}
                        className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                        {isGenerating ? "生成中..." : "🚀 生成四格漫畫"}
                    </button>

                    <button
                        onClick={handleAnalyzeConsistency}
                        disabled={isGenerating || isAnalyzing || frames.filter(f => f.imageUrl).length < 2}
                        className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all disabled:opacity-50 border border-white/20"
                    >
                        {isAnalyzing ? "分析中..." : "🧠 連貫性深度分析"}
                    </button>
                </div>

                {/* Right: Preview Grid */}
                <div className="flex-1 bg-black/20 p-8 overflow-y-auto flex flex-col items-center">
                    <div className="grid grid-cols-2 gap-4 w-full h-full max-w-4xl aspect-square">
                        {frames.map((frame) => (
                            <div
                                key={frame.id}
                                className="relative bg-gray-800 rounded-xl border-2 border-dashed border-gray-700 overflow-hidden group hover:border-purple-500/50 transition-colors"
                            >
                                {frame.loading ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50">
                                        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-xs text-purple-300">繪製 Frame {frame.id}...</span>
                                    </div>
                                ) : frame.imageUrl ? (
                                    <div className="w-full h-full relative">
                                        <img src={frame.imageUrl} alt={`Frame ${frame.id}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                            <p className="text-white text-xs line-clamp-2">{frame.prompt}</p>
                                        </div>
                                        <a
                                            href={frame.imageUrl}
                                            download={`storyboard-frame-${frame.id}.png`}
                                            className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-600"
                                            title="下載此圖"
                                            target="_blank"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </a>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                                        <span className="text-4xl font-bold opacity-20">{frame.id}</span>
                                        <span className="text-sm">等待生成</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Story Analysis Results */}
                    {storyAnalysis && (
                        <div className="w-full max-w-4xl mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-indigo-300 flex items-center gap-2">
                                        ✨ 故事腳本與連貫性分析
                                    </h3>
                                    <div className="flex items-center gap-2 bg-indigo-500/30 px-3 py-1 rounded-full">
                                        <span className="text-xs text-indigo-200">連貫性評分</span>
                                        <span className="text-lg font-black text-white">{storyAnalysis.consistency.score}</span>
                                    </div>
                                </div>

                                <p className="text-gray-300 text-sm leading-relaxed mb-6 italic">
                                    「{storyAnalysis.summary}」
                                </p>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">分鏡腳本</h4>
                                        <div className="space-y-3">
                                            {storyAnalysis.script.map((s: any, idx: number) => (
                                                <div key={idx} className="bg-black/20 p-3 rounded-lg border border-white/5">
                                                    <span className="text-[10px] text-indigo-500 font-bold block mb-1">SCENE {s.scene}</span>
                                                    <p className="text-xs text-gray-300">{s.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">連貫性分析</h4>
                                            <p className="text-xs text-gray-400 leading-relaxed bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                                                {storyAnalysis.consistency.analysis}
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2">下一幕建議</h4>
                                            <p className="text-xs text-gray-400 leading-relaxed bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                                                {storyAnalysis.nextScene}
                                            </p>
                                        </div>

                                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                            <p className="text-xs text-indigo-300 font-medium mb-1">💡 優化意見</p>
                                            <p className="text-[11px] text-gray-400">{storyAnalysis.consistencyAdvice}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
