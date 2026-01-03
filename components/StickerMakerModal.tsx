"use client";

import { useState, useRef } from "react";

interface StickerMakerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function StickerMakerModal({ isOpen, onClose }: StickerMakerModalProps) {
    const [mode, setMode] = useState<'generate' | 'upload'>('generate');
    const [prompt, setPrompt] = useState("Cute cat sticker, vector art, white outline, die-cut");
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Generation Handler
    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        setProcessedImageUrl(null);

        try {
            const apiKey = localStorage.getItem('geminiApiKey');
            const res = await fetch("/api/prompts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: prompt + ", vector sticker, white outline, die-cut, isolated on white background",
                    width: 1024,
                    height: 1024,
                    provider: "gemini",
                    imageEngine: "gemini-native",
                    previewMode: true,
                    apiKey
                }),
            });

            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();

            if (data.images && data.images.length > 0) {
                setImageUrl(data.images[0]);
                // Auto trigger bg removal for text-generated stickers
                // handleRemoveBg(data.images[0]); // Optional: auto-trigger
            } else {
                throw new Error("No image generated");
            }
        } catch (err: any) {
            setError(err.message || "Generation Failed");
        } finally {
            setLoading(false);
        }
    };

    // Upload Handler
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);
        setProcessedImageUrl(null);

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
                        tags: 'sticker_upload'
                    })
                });

                if (!res.ok) throw new Error('Upload failed');
                const data = await res.json();
                setImageUrl(data.url || base64); // Prefer server URL if returned
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    // Background Removal
    const handleRemoveBg = async () => {
        if (!imageUrl) return;
        setLoading(true);
        setError(null);

        try {
            // Fetch image to get base64
            const imgRes = await fetch(imageUrl);
            const blob = await imgRes.blob();
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });

            const apiKey = localStorage.getItem('geminiApiKey');
            const res = await fetch("/api/remove-bg", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64: base64.split(',')[1], // Remove prefix
                    mimeType: blob.type,
                    apiKey
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Background removal failed");

            if (data.imageBase64) {
                setProcessedImageUrl(`data:${data.mimeType};base64,${data.imageBase64}`);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Save Logic
    const handleSave = async () => {
        const targetImage = processedImageUrl || imageUrl;
        if (!targetImage) return;

        setLoading(true);
        try {
            const res = await fetch("/api/prompts", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageUrl: targetImage,
                    prompt: prompt,
                    originalPrompt: prompt,
                    promptZh: "AI 貼圖",
                    tags: "sticker, transparent, ai-generated",
                    width: 1024,
                    height: 1024
                }),
            });

            if (!res.ok) throw new Error("Failed to save");
            alert("✅ Sticker Saved to Gallery!");
            onClose();
            // Ideally trigger refresh
            window.location.reload();
        } catch (err: any) {
            setError("Save failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-[#1A1206]/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-5xl h-[85vh] flex flex-col md:flex-row gap-6">

                {/* Left Panel: Controls */}
                <div className="w-full md:w-1/3 bg-[#1A1206] border border-amber-700/40 rounded-2xl p-6 flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-emerald-500">
                            🏷️ Sticker Maker
                        </h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-black/40 p-1 rounded-lg">
                        <button
                            onClick={() => setMode('generate')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'generate' ? 'bg-amber-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            ✨ Generate
                        </button>
                        <button
                            onClick={() => setMode('upload')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'upload' ? 'bg-amber-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            📤 Upload
                        </button>
                    </div>

                    {/* Inputs */}
                    <div className="flex-1 space-y-4 overflow-y-auto min-h-0 custom-scrollbar pr-2">
                        {mode === 'generate' ? (
                            <div>
                                <label className="text-xs text-gray-400 mb-2 block">Sticker Prompt</label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="w-full h-32 bg-black/50 border border-gray-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-green-500"
                                    placeholder="Describe your sticker..."
                                />
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading || !prompt}
                                    className="w-full mt-4 py-3 bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-900/20 disabled:opacity-50"
                                >
                                    {loading ? "Generating..." : "🎨 Create Sticker"}
                                </button>
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-green-500 transition-colors bg-black/20">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleUpload}
                                    className="hidden"
                                    id="sticker-upload"
                                />
                                <label htmlFor="sticker-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                    <span className="text-4xl">📁</span>
                                    <span className="text-sm text-gray-400">Click to upload image</span>
                                </label>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-500/20 text-red-300 text-xs rounded-lg border border-red-500/30">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 mt-auto pt-6 border-t border-white/10">
                        <button
                            onClick={handleRemoveBg}
                            disabled={loading || !imageUrl}
                            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors border border-white/5 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            ✂️ Remove Background
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={loading || (!imageUrl && !processedImageUrl)}
                            className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 shadow-lg"
                        >
                            💾 Save to Gallery
                        </button>
                    </div>
                </div>

                {/* Right Panel: Preview */}
                <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-[#2D1B0E] rounded-2xl flex items-center justify-center border border-amber-700/40 relative overflow-hidden p-8">
                    {/* Checkerboard pattern for transparency */}
                    <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: 'linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                    }}></div>

                    {processedImageUrl ? (
                        <div className="relative group animate-in zoom-in-50 duration-300">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={processedImageUrl} alt="Processed Sticker" className="max-w-full max-h-[70vh] object-contain drop-shadow-2xl" />
                            <div className="absolute bottom-4 right-4 bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                Unbg Applied
                            </div>
                            <button
                                onClick={() => setProcessedImageUrl(null)}
                                className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Revert to Original"
                            >
                                ↺
                            </button>
                        </div>
                    ) : imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={imageUrl} alt="Original" className="max-w-full max-h-[70vh] object-contain shadow-2xl z-10" />
                    ) : (
                        <div className="text-gray-500 flex flex-col items-center gap-4 z-10">
                            <span className="text-6xl opacity-30">✨</span>
                            <p>Generate or upload an image to start</p>
                        </div>
                    )}

                    {loading && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-amber-400 font-bold animate-pulse">Processing...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
