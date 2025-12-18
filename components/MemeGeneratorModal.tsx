"use client";

import { useState } from "react";

interface MemeGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit: (imageUrl: string, caption: string) => void;
}

export default function MemeGeneratorModal({ isOpen, onClose, onEdit }: MemeGeneratorModalProps) {
    const [mode, setMode] = useState<'upload' | 'generate'>('upload');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState("A funny coding meme about fixing bugs in production");
    const [topic, setTopic] = useState(""); // For caption generation context
    const [loading, setLoading] = useState(false);
    const [captions, setCaptions] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Upload Image
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);
        // Reset captions when new image is loaded
        setCaptions([]);

        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const base64 = reader.result as string;
                // We just keep base64 for local preview and sending to Gemini
                setImageUrl(base64);
            } catch (err: any) {
                setError("Failed to load image");
            } finally {
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    // Generate Image
    const handleGenerateImage = async () => {
        setLoading(true);
        setError(null);
        setCaptions([]);
        try {
            const apiKey = localStorage.getItem('geminiApiKey');
            const res = await fetch("/api/prompts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: prompt + ", blank meme template, clean background, no text, no captions, funny context visual only, cinematic lighting",
                    width: 1024,
                    height: 1024,
                    negativePrompt: "text, caption, words, letters, watermark, signature, logo, writing",
                    provider: "gemini",
                    imageEngine: "gemini-native", // Use native for better text/scene understanding potentially
                    previewMode: true,
                    apiKey
                }),
            });

            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();

            if (data.images && data.images.length > 0) {
                setImageUrl(data.images[0]);
            } else {
                throw new Error("No image generated");
            }
        } catch (err: any) {
            setError(err.message || "Image Generation Failed");
        } finally {
            setLoading(false);
        }
    };

    // Generate Captions
    const handleGenerateCaptions = async () => {
        if (!imageUrl) return;
        setLoading(true);
        setError(null);
        try {
            // Get base64 if it's a generated URL (starts with /uploads)
            let base64 = imageUrl;
            let mimeType = "image/png";

            if (imageUrl.startsWith('/uploads') || imageUrl.startsWith('http')) {
                const imgRes = await fetch(imageUrl);
                const blob = await imgRes.blob();
                mimeType = blob.type;
                base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            }

            const apiKey = localStorage.getItem('geminiApiKey');
            const res = await fetch("/api/meme-gen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64: base64.includes('base64,') ? base64.split(',')[1] : base64,
                    mimeType,
                    topic, // Optional context
                    apiKey
                }),
            });

            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();

            if (data.captions && Array.isArray(data.captions)) {
                setCaptions(data.captions);
            } else {
                throw new Error("Invalid response format");
            }

        } catch (err: any) {
            setError(err.message || "Caption Generation Failed");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-5xl h-[85vh] flex flex-col md:flex-row gap-6">

                {/* Left Panel: Controls */}
                <div className="w-full md:w-1/3 bg-gray-900 border border-white/10 rounded-2xl p-6 flex flex-col gap-6 overflow-y-auto">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
                            🤡 Meme God
                        </h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex bg-black/40 p-1 rounded-lg">
                        <button
                            onClick={() => setMode('upload')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'upload' ? 'bg-orange-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            📤 Upload
                        </button>
                        <button
                            onClick={() => setMode('generate')}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'generate' ? 'bg-orange-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            ✨ Generate
                        </button>
                    </div>

                    {/* Image Source */}
                    <div className="space-y-4">
                        {mode === 'upload' ? (
                            <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-orange-500 transition-colors bg-black/20">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleUpload}
                                    className="hidden"
                                    id="meme-upload"
                                />
                                <label htmlFor="meme-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                    <span className="text-4xl">🖼️</span>
                                    <span className="text-sm text-gray-400">Upload Meme Template</span>
                                </label>
                            </div>
                        ) : (
                            <div>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="w-full h-24 bg-black/50 border border-gray-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-orange-500"
                                    placeholder="Describe the meme template..."
                                />
                                <button
                                    onClick={handleGenerateImage}
                                    disabled={loading || !prompt}
                                    className="w-full mt-2 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-all"
                                >
                                    Generate Template
                                </button>
                            </div>
                        )}
                    </div>

                    <hr className="border-white/10" />

                    {/* Caption Gen */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-gray-400">🧠 AI Caption Generator</h3>
                        <input
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            placeholder="Optional: Topic/Context (e.g. 'Monday morning')"
                            className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-orange-500"
                        />
                        <button
                            onClick={handleGenerateCaptions}
                            disabled={loading || !imageUrl}
                            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-black font-bold rounded-xl transition-all shadow-lg shadow-orange-900/20 disabled:opacity-50"
                        >
                            {loading ? "Thinking..." : "🔥 Generate Captions"}
                        </button>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/20 text-red-300 text-xs rounded-lg border border-red-500/30">
                            {error}
                        </div>
                    )}
                </div>

                {/* Right Panel: Preview & Captions */}
                <div className="flex-1 flex flex-col gap-4">
                    {/* Preview Image */}
                    <div className="flex-1 bg-black/40 rounded-2xl flex items-center justify-center border border-white/10 relative overflow-hidden p-4">
                        {imageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={imageUrl} alt="Meme Template" className="max-w-full max-h-[50vh] object-contain shadow-2xl" />
                        ) : (
                            <div className="text-gray-500">No image selected</div>
                        )}
                        {loading && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                <div className="text-orange-400 font-bold animate-pulse">Cooking...</div>
                            </div>
                        )}
                    </div>

                    {/* Captions List */}
                    <div className="flex-1 bg-gray-900 rounded-2xl p-6 overflow-y-auto border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">📝 AI Suggestions</h3>
                        {captions.length === 0 ? (
                            <div className="text-gray-500 text-center py-10">
                                Generated captions will appear here. <br />
                                Click one to edit!
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {captions.map((cap, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => imageUrl && onEdit(imageUrl, cap)}
                                        className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-orange-500/50 rounded-xl cursor-pointer transition-all group"
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <p className="text-white text-lg font-medium">“{cap}”</p>
                                            <span className="opacity-0 group-hover:opacity-100 text-xs bg-orange-500 text-black px-2 py-1 rounded-full font-bold">EDIT</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
