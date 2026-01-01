import { useRef } from "react";

interface ProviderSelectorProps {
    imageEngine: 'flash' | 'pro' | 'imagen';
    setImageEngine: (engine: 'flash' | 'pro' | 'imagen') => void;
    imageCount: number;
    setImageCount: (count: number) => void;
    useSearch: boolean;
}

export default function ProviderSelector({
    imageEngine,
    setImageEngine,
    imageCount,
    setImageCount,
    useSearch
}: ProviderSelectorProps) {
    return (
        <div className="space-y-3">
            <label className="text-xs text-gray-400 block font-medium">生圖引擎 (Image Engine)</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                    type="button"
                    onClick={() => {
                        setImageEngine("flash");
                        setImageCount(1);
                    }}
                    className={`group relative flex flex-col items-center gap-1 py-3 px-3 rounded-xl border transition-all ${imageEngine === "flash"
                        ? "bg-orange-500/10 border-orange-500/50 text-orange-200 shadow-[0_0_20px_rgba(249,115,22,0.15)]"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20"
                        }`}
                >
                    <div className="flex items-center gap-1.5 font-bold text-sm">
                        <span className={imageEngine === 'flash' ? 'text-orange-400' : ''}>⚡</span> Gemini 3 Flash
                    </div>
                    <span className="text-[10px] opacity-60 font-normal">極速生成，適合測試</span>
                    {imageEngine === "flash" && <div className="absolute inset-x-0 -bottom-px h-1 bg-orange-500 rounded-b-xl" />}
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setImageEngine("pro");
                        setImageCount(1);
                    }}
                    className={`group relative flex flex-col items-center gap-1 py-3 px-3 rounded-xl border transition-all ${imageEngine === "pro"
                        ? "bg-purple-500/10 border-purple-500/50 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20"
                        }`}
                >
                    <div className="flex items-center gap-1.5 font-bold text-sm">
                        <span className={imageEngine === 'pro' ? 'text-purple-400' : ''}>🧠</span> Gemini 3 Pro
                    </div>
                    <span className="text-[10px] opacity-60 font-normal text-center">深度推理，適合繁體中文排版</span>
                    {imageEngine === "pro" && <div className="absolute inset-x-0 -bottom-px h-1 bg-purple-500 rounded-b-xl" />}
                </button>

                <button
                    type="button"
                    onClick={() => setImageEngine("imagen")}
                    className={`group relative flex flex-col items-center gap-1 py-3 px-3 rounded-xl border transition-all ${imageEngine === "imagen"
                        ? "bg-blue-500/10 border-blue-500/50 text-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20"
                        }`}
                >
                    <div className="flex items-center gap-1.5 font-bold text-sm">
                        <span className={imageEngine === 'imagen' ? 'text-blue-400' : ''}>🎨</span> Imagen 4.0
                    </div>
                    <span className="text-[10px] opacity-60 font-normal text-center">商業品質，文字渲染最精準</span>
                    {imageEngine === "imagen" && <div className="absolute inset-x-0 -bottom-px h-1 bg-blue-500 rounded-b-xl" />}
                </button>
            </div>

            {/* Image Count Selector */}
            <div className={`space-y-2 transition-all duration-300 ${imageEngine !== 'imagen' ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
                <div className="flex justify-between items-center">
                    <label className="text-xs text-gray-400 block">生成數量 (Image Count)</label>
                    {imageEngine !== 'imagen' && (
                        <span className="text-[10px] text-amber-500/70 italic">Flash/Pro 目前僅限 1 張</span>
                    )}
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map(count => (
                        <button
                            key={count}
                            type="button"
                            disabled={imageEngine !== 'imagen'}
                            onClick={() => setImageCount(count)}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${imageCount === count && imageEngine === 'imagen'
                                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/30"
                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            {count} 張
                        </button>
                    ))}
                </div>
                {imageCount > 1 && imageEngine === 'imagen' && (
                    <p className="text-[10px] text-amber-400 animate-in fade-in slide-in-from-top-1">
                        💡 多圖模式：生成後可預覽並選擇最滿意的一張存入圖庫
                    </p>
                )}
            </div>
        </div>
    );
}
