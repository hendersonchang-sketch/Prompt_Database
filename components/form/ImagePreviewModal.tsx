import { useRef, useEffect } from "react";
import { Sparkles } from "lucide-react";

interface ImagePreviewModalProps {
    images: string[];
    data: any;
    onClose: () => void;
    onSave: (url: string) => void;
    onDownload: (url: string, index: number) => void;
    loading: boolean;
    lastEnhancedPrompt: string;
    isLastResultEnhanced: boolean;
}

export default function ImagePreviewModal({
    images,
    data,
    onClose,
    onSave,
    onDownload,
    loading,
    lastEnhancedPrompt,
    isLastResultEnhanced
}: ImagePreviewModalProps) {
    if (!images || images.length === 0) return null;

    return (
        <div className="fixed inset-0 z-50 bg-[#1A1206]/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#1A1206] rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-amber-700/40">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-amber-100">
                        📸 預覽選擇 (共 {images.length} 張)
                    </h3>
                    {data?.partialResults && (
                        <div className="px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded-full text-amber-200 text-[10px] animate-pulse">
                            ⚠️ 部分圖片因安全過濾已移除 ({data.actualCount}/{data.requestedCount})
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        ✕ 關閉
                    </button>
                </div>

                {isLastResultEnhanced && lastEnhancedPrompt && (
                    <div className="mb-6 p-4 bg-amber-900/10 border border-amber-500/30 rounded-xl animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-2 mb-2 text-amber-300 font-bold text-sm">
                            <Sparkles className="w-4 h-4 animate-pulse text-amber-500" />
                            <span>AI 煉金成果 (Master Alchemist Result)</span>
                        </div>
                        <div className="text-xs text-amber-100/80 leading-relaxed font-mono bg-[#0F0A05]/30 p-3 rounded-lg border border-amber-500/10">
                            {lastEnhancedPrompt.slice(0, 300) + "..."}
                        </div>
                        <div className="mt-2 text-[10px] text-amber-400 italic">
                            * 以此高品質指令為例，AI 為您擴充了光影、質感與構圖細節。
                        </div>
                    </div>
                )}

                <div className={`grid gap-4 ${images.length === 2 ? 'grid-cols-2' : images.length >= 3 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
                    {images.map((imgUrl, idx) => (
                        <div key={idx} className="group relative bg-[#0F0A05] rounded-xl overflow-hidden border border-amber-700/30 hover:border-amber-500/50 transition-all">
                            <img
                                src={imgUrl}
                                alt={`Preview ${idx + 1}`}
                                className="w-full aspect-square object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    type="button"
                                    onClick={() => onDownload(imgUrl, idx)}
                                    className="flex-1 py-2 px-3 bg-white/20 hover:bg-white/30 rounded-lg text-sm text-white font-medium transition-all flex items-center justify-center gap-1"
                                >
                                    ⬇️ 下載
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onSave(imgUrl)}
                                    disabled={loading}
                                    className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-500 rounded-lg text-sm text-white font-medium transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                                >
                                    ✓ 存入圖庫
                                </button>
                            </div>
                            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                #{idx + 1}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-gray-300 transition-all"
                    >
                        全部放棄，重新生成
                    </button>
                </div>
            </div>
        </div>
    );
}
