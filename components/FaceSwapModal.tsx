"use client";

import React, { useState, useRef, useEffect } from 'react';

interface FaceSwapModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface UploadCardProps {
    title: string;
    image: string | null;
    onUpload: (base64: string) => void;
    isLoading: boolean;
    accent: string;
}

const UploadCard: React.FC<UploadCardProps> = ({ title, image, onUpload, isLoading, accent }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => onUpload(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className={`relative group overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-4 transition-all hover:border-${accent}-500/50`}>
            <div className="flex flex-col items-center justify-center min-h-[350px] w-full gap-4">
                {image ? (
                    <div className="w-full h-[300px] bg-black/40 rounded-xl overflow-hidden flex items-center justify-center">
                        <img src={image} alt={title} className="max-w-full max-h-full object-contain" />
                    </div>
                ) : (
                    <div className="flex flex-col items-center opacity-40 py-12">
                        <span className="text-4xl mb-2">📸</span>
                        <span className="text-sm font-medium text-white">{title}</span>
                    </div>
                )}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="px-6 py-2 rounded-xl bg-white/10 border border-white/10 text-xs font-bold text-white hover:bg-white/20 transition-all disabled:opacity-50"
                >
                    {image ? 'Change Image' : 'Select Image'}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
        </div>
    );
};

export default function FaceSwapModal({ isOpen, onClose }: FaceSwapModalProps) {
    const [sourceFace, setSourceFace] = useState<string | null>(null);
    const [targetScene, setTargetScene] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState("");

    const messages = [
        "正在提取面部 DNA 特徵...",
        "正在匹配目標場景光影...",
        "正在進行無縫邊緣融合...",
        "正在校準皮膚色調與紋理...",
        "正在優化五官立體感...",
        "AI 正在構思最終合成方案..."
    ];

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (loading) {
            setLoadingMessage(messages[0]);
            let i = 1;
            interval = setInterval(() => {
                setLoadingMessage(messages[i % messages.length]);
                i++;
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [loading]);

    const handleGenerate = async () => {
        if (!sourceFace || !targetScene) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: 'Face Swap Instruction: Identify the facial identity and specific features (eyes, nose, mouth, jawline) from Image 1. Digitally transplant this exact face onto the character in Image 2. Constraint: DO NOT change the clothing, body shape, pose, or background of Image 2. Only the face should be updated to match the person in Image 1. Ensure seamless skin tone blending.',
                    engineType: 'pro',
                    images: [sourceFace, targetScene],
                    thinkingLevel: 'high'
                }),
            });
            const data = await response.json();
            if (data.success && data.imageBase64) {
                setResultImage(`data:image/png;base64,${data.imageBase64}`);
            } else {
                setError(data.error || 'Failed to generate');
            }
        } catch (err: any) {
            setError(err.message || 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveToGallery = async () => {
        if (!resultImage) return;
        setLoading(true);
        try {
            const res = await fetch("/api/prompts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageUrl: resultImage,
                    prompt: "AI Face Swap Result",
                    tags: "FaceSwap, Gemini Pro",
                    width: 1024,
                    height: 1024
                }),
            });
            if (res.ok) alert("✅ 已成功存入圖庫！");
        } catch (e) {
            alert("儲存失敗");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!resultImage) return;
        try {
            const byteString = atob(resultImage.split(',')[1]);
            const mimeString = resultImage.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
            const blob = new Blob([ab], { type: mimeString });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `faceswap-${Date.now()}.png`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed:", err);
            const link = document.createElement('a');
            link.href = resultImage;
            link.download = `faceswap-${Date.now()}.png`;
            link.click();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 overflow-hidden">
            <div className="w-full max-w-6xl mx-auto bg-gray-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/5 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            🎭 AI Face Swap
                            <span className="text-[10px] font-normal text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">Pro Vision</span>
                        </h2>
                        <p className="text-xs text-gray-400 mt-1">移植臉部特徵並保留原始場景與服裝</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors group"
                    >
                        <svg className="w-5 h-5 text-gray-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <UploadCard title="我的臉 (Source)" image={sourceFace} onUpload={setSourceFace} isLoading={loading} accent="violet" />
                        <UploadCard title="目標場景 (Target)" image={targetScene} onUpload={setTargetScene} isLoading={loading} accent="cyan" />
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !sourceFace || !targetScene}
                            className="px-12 py-4 rounded-full bg-white text-black font-bold text-lg hover:scale-105 transition-all disabled:opacity-50 shadow-xl"
                        >
                            {loading ? 'Processing...' : 'Generate Swap'}
                        </button>

                        {loading && (
                            <div className="flex flex-col items-center animate-pulse">
                                <span className="text-cyan-400 text-sm font-medium">{loadingMessage}</span>
                            </div>
                        )}

                        {error && <div className="text-red-400 text-sm">{error}</div>}
                    </div>

                    {resultImage && (
                        <div className="pt-8 border-t border-white/10 text-center space-y-6">
                            <h3 className="text-xl font-bold text-white">Result</h3>
                            <div className="max-w-2xl mx-auto rounded-2xl overflow-hidden border border-white/10 bg-black/40 p-2">
                                <img src={resultImage} alt="Result" className="w-full h-auto rounded-lg" />
                            </div>
                            <div className="flex justify-center gap-4">
                                <button onClick={handleDownload} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition-all">📥 下載圖片</button>
                                <button onClick={handleSaveToGallery} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl transition-all shadow-lg">✓ 存入圖庫</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-black/20 text-center shrink-0">
                    <p className="text-[10px] text-zinc-500">
                        提示：請確保 Source Face 臉部清晰，Target Scene 最好只有一個人物以便獲得最佳效果。
                    </p>
                </div>
            </div>
        </div>
    );
}
