"use client";

import { useState, useEffect } from "react";

interface StyleTunerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface PromptImage {
    id: string;
    imageUrl: string;
    prompt: string;
}

interface TunerResult {
    styleName: string;
    styleDescription: string;
    keywords: string[];
}

export default function StyleTunerModal({ isOpen, onClose }: StyleTunerModalProps) {
    const [loading, setLoading] = useState(true);
    const [images, setImages] = useState<PromptImage[]>([]);
    const [currentRound, setCurrentRound] = useState(0);
    const [pair, setPair] = useState<[PromptImage, PromptImage] | null>(null);
    const [winners, setWinners] = useState<string[]>([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<TunerResult | null>(null);

    const TOTAL_ROUNDS = 5;

    // Initialize: Fetch random images
    useEffect(() => {
        if (isOpen) {
            resetTuner();
        }
    }, [isOpen]);

    const resetTuner = () => {
        setLoading(true);
        setResult(null);
        setWinners([]);
        setCurrentRound(0); // 0-based index

        fetch('/api/prompts')
            .then(res => res.json())
            .then((data: any[]) => {
                // Filter items with imageUrl
                const validImages = data.filter(d => d.imageUrl && !d.imageUrl.startsWith("http")); // Prefer local generated ones if possible? Or all.
                // Actually filter all valid images
                const pool = validImages.length >= 10 ? validImages : data.filter(d => d.imageUrl);

                if (pool.length < 2) {
                    alert("資料庫圖片不足，無法進行風格調校。請先生成更多圖片！");
                    onClose();
                    return;
                }

                // Shuffle
                const shuffled = pool.sort(() => 0.5 - Math.random());
                setImages(shuffled);
                pickPair(shuffled, 0);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const pickPair = (pool: PromptImage[], roundIndex: number) => {
        // Simple logic: pick 2*roundIndex and 2*roundIndex+1
        const idx1 = (roundIndex * 2) % pool.length;
        const idx2 = (roundIndex * 2 + 1) % pool.length;

        // Ensure strictly different
        if (pool[idx1].id === pool[idx2].id && pool.length > 2) {
            // Edge case logic if pool is small, but we checked length >=2
        }

        setPair([pool[idx1], pool[idx2]]);
    };

    const handleVote = (winner: PromptImage) => {
        const newWinners = [...winners, winner.id];
        setWinners(newWinners);

        if (currentRound + 1 >= TOTAL_ROUNDS) {
            // Finish
            analyzeStyle(newWinners);
        } else {
            // Next Round
            setCurrentRound(prev => prev + 1);
            pickPair(images, currentRound + 1);
        }
    };

    const analyzeStyle = async (winningIds: string[]) => {
        setAnalyzing(true);
        try {
            const res = await fetch('/api/style-tuner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selectedPromptIds: winningIds,
                    apiKey: localStorage.getItem('geminiApiKey')
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setResult(data);
        } catch (error) {
            console.error(error);
            alert("分析失敗");
        } finally {
            setAnalyzing(false);
        }
    };

    const saveStyleSnippet = async () => {
        if (!result) return;
        try {
            await fetch('/api/prompt-lab/snippets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: 'Style',
                    content: result.keywords.join(", "),
                    label: result.styleName
                })
            });
            alert("已儲存為 Prompt Snippet！");
            onClose();
        } catch (e) {
            alert("儲存失敗");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-[#1A1206]/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-4xl h-[80vh] flex flex-col items-center justify-center relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-0 right-0 p-4 text-white/50 hover:text-white"
                >
                    ✕
                </button>

                {/* Loading State */}
                {loading && <div className="text-white animate-pulse">載入圖片庫...</div>}

                {/* Analysis State */}
                {analyzing && (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <h2 className="text-2xl font-bold text-white">AI 正在分析您的審美...</h2>
                        <p className="text-amber-300">正在提煉風格 DNA</p>
                    </div>
                )}

                {/* Result State */}
                {result && !analyzing && (
                    <div className="bg-[#1A1206] border border-amber-500/30 p-8 rounded-2xl max-w-lg text-center shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                        <div className="text-5xl mb-4">✨</div>
                        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 mb-2">
                            {result.styleName}
                        </h2>
                        <p className="text-amber-100/80 text-sm mb-6">{result.styleDescription}</p>

                        <div className="flex flex-wrap gap-2 justify-center mb-8">
                            {result.keywords.map(k => (
                                <span key={k} className="bg-amber-900/50 text-amber-200 px-3 py-1 rounded-full text-xs font-mono border border-amber-500/20">
                                    {k}
                                </span>
                            ))}
                        </div>

                        <button
                            onClick={saveStyleSnippet}
                            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/30"
                        >
                            存入 Prompt Snippets
                        </button>
                    </div>
                )}

                {/* Voting State */}
                {!loading && !analyzing && !result && pair && (
                    <div className="w-full h-full flex flex-col">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">⚖️ 風格二選一</h2>
                            <div className="w-64 h-2 bg-gray-800 rounded-full mx-auto overflow-hidden">
                                <div
                                    className="h-full bg-amber-500 transition-all duration-300"
                                    style={{ width: `${(currentRound / TOTAL_ROUNDS) * 100}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Round {currentRound + 1} / {TOTAL_ROUNDS}</p>
                        </div>

                        <div className="flex-1 flex gap-4 md:gap-12 items-center justify-center">
                            {/* Option A */}
                            <div
                                onClick={() => handleVote(pair[0])}
                                className="relative group cursor-pointer w-1/2 max-w-sm aspect-[3/4] rounded-2xl overflow-hidden border-2 border-transparent hover:border-amber-500 transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                            >
                                <img src={pair[0].imageUrl} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-amber-500/10 transition-colors flex items-center justify-center">
                                    <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white px-4 py-2 rounded-full font-bold backdrop-blur">
                                        喜歡這個
                                    </span>
                                </div>
                            </div>

                            {/* VS */}
                            <div className="text-2xl font-black text-gray-700 italic">VS</div>

                            {/* Option B */}
                            <div
                                onClick={() => handleVote(pair[1])}
                                className="relative group cursor-pointer w-1/2 max-w-sm aspect-[3/4] rounded-2xl overflow-hidden border-2 border-transparent hover:border-orange-500 transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]"
                            >
                                <img src={pair[1].imageUrl} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-orange-500/10 transition-colors flex items-center justify-center">
                                    <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white px-4 py-2 rounded-full font-bold backdrop-blur">
                                        喜歡這個
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
