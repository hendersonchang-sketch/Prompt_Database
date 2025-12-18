"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface MagicCanvasProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function MagicCanvas({ isOpen, onClose }: MagicCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
    const [brushSize, setBrushSize] = useState(30);
    const [isDrawing, setIsDrawing] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [resultImage, setResultImage] = useState<string | null>(null);

    // Initial setup
    useEffect(() => {
        if (isOpen && canvasRef.current && containerRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setImage(null);
            setOriginalImageSrc(null);
            setResultImage(null);
        }
    }, [isOpen]);

    // Handle Image Upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                setImage(img);
                setOriginalImageSrc(event.target?.result as string);

                // Set Canvas Size
                if (canvasRef.current) {
                    const maxWidth = 800;
                    const scale = maxWidth / img.width;
                    const finalWidth = Math.min(img.width, maxWidth);
                    const finalHeight = img.height * (finalWidth / img.width);

                    canvasRef.current.width = finalWidth;
                    canvasRef.current.height = finalHeight;

                    // Draw Image
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
                    }
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    // Drawing Logic
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!image || isGenerating) return;
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) ctx.beginPath(); // Reset path
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !canvasRef.current || !image) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'source-over'; // Standard drawing
        // We want to draw visual feedback for mask. We can draw semi-transparent white.
        // Wait, for mask extraction later, we need a clean mask. 
        // Strategy: Draw on the visible canvas for user feedback (white with opacity), 
        // AND maybe maintain an offscreen canvas for the actual binary mask?
        // Simpler: Draw white on top. When generating, we'll extract the "white" pixels as mask.

        ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clearMask = () => {
        if (!canvasRef.current || !image) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        // Clear everything
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        // Redraw image
        ctx.drawImage(image, 0, 0, canvasRef.current.width, canvasRef.current.height);
    };

    const handleGenerate = async () => {
        if (!canvasRef.current || !image || !prompt.trim()) return;
        setIsGenerating(true);

        try {
            // 1. Get Original Image (Base64) - we scale it to canvas size for consistency
            const originalCanvas = document.createElement('canvas');
            originalCanvas.width = canvasRef.current.width;
            originalCanvas.height = canvasRef.current.height;
            const origCtx = originalCanvas.getContext('2d');
            origCtx?.drawImage(image, 0, 0, originalCanvas.width, originalCanvas.height);
            const imageBase64 = originalCanvas.toDataURL('image/png');

            // 2. Generate Mask (Binary)
            // We need to compare current canvas with original image. 
            // Pixels that are different (whiter) are the mask.
            // OR: Easier way: Since we drew rgba(255,255,255,0.7), we can just check pixels or...
            // ALTERNATIVE: Use 2 layers (React state). But single canvas is simpler.
            // Let's assume we drew white on top.

            // Create Mask Canvas
            const maskCanvas = document.createElement('canvas');
            maskCanvas.width = canvasRef.current.width;
            maskCanvas.height = canvasRef.current.height;
            const maskCtx = maskCanvas.getContext('2d');
            if (!maskCtx) throw new Error("No mask context");

            // Build mask logic: 
            // Read pixel data from displayed canvas
            const displayedData = canvasRef.current.getContext('2d')?.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
            // Read pixel data from original clean canvas
            const originalData = origCtx?.getImageData(0, 0, originalCanvas.width, originalCanvas.height);

            if (displayedData && originalData) {
                const maskImageData = maskCtx.createImageData(maskCanvas.width, maskCanvas.height);
                for (let i = 0; i < displayedData.data.length; i += 4) {
                    // Simple Diff: If pixel is significantly brighter/different than original, it's mask.
                    // Since we drew white (255,255,255) with 0.7 opacity, it will be lighter.

                    const dr = Math.abs(displayedData.data[i] - originalData.data[i]);
                    const dg = Math.abs(displayedData.data[i + 1] - originalData.data[i + 1]);
                    const db = Math.abs(displayedData.data[i + 2] - originalData.data[i + 2]);

                    const isMask = (dr + dg + db) > 20; // Threshold

                    if (isMask) {
                        maskImageData.data[i] = 255;
                        maskImageData.data[i + 1] = 255;
                        maskImageData.data[i + 2] = 255;
                        maskImageData.data[i + 3] = 255; // Opaque white
                    } else {
                        maskImageData.data[i] = 0;
                        maskImageData.data[i + 1] = 0;
                        maskImageData.data[i + 2] = 0;
                        maskImageData.data[i + 3] = 255; // Opaque Black (or transparent?) Gemini usually expects White=Mask, Black=Background
                    }
                }
                maskCtx.putImageData(maskImageData, 0, 0);
            }

            const maskBase64 = maskCanvas.toDataURL('image/png');

            // 3. Send to API
            const res = await fetch('/api/magic-canvas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: imageBase64,
                    mask: maskBase64,
                    prompt: prompt,
                    apiKey: localStorage.getItem('geminiApiKey') || ""
                })
            });

            const data = await res.json();
            if (data.imageUrl) {
                setResultImage(data.imageUrl);
            } else {
                alert("生成失敗: " + (data.error || "未知錯誤"));
            }

        } catch (error) {
            console.error(error);
            alert("發生錯誤");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 border border-white/20 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col md:flex-row overflow-hidden" onClick={e => e.stopPropagation()}>

                {/* Tools Sidebar */}
                <div className="w-full md:w-80 bg-gray-800/50 border-r border-white/10 p-6 flex flex-col gap-6 overflow-y-auto shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-1">🖌️ Magic Canvas</h2>
                        <p className="text-xs text-gray-400">塗抹區域，AI 幫你改！</p>
                    </div>

                    {!image && (
                        <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:bg-white/5 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="text-4xl mb-2">📁</div>
                            <span className="text-sm text-gray-400">上傳圖片開始</span>
                        </div>
                    )}

                    {image && (
                        <>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-400 mb-2 block">畫筆大小</label>
                                    <input
                                        type="range"
                                        min="5"
                                        max="100"
                                        value={brushSize}
                                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                <button
                                    onClick={clearMask}
                                    className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                                >
                                    清除塗抹 (Reset Mask)
                                </button>
                            </div>

                            <div className="space-y-2 mt-auto">
                                <label className="text-xs font-medium text-gray-400 block">你想要改成什麼？</label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="例如：戴上紅色墨鏡、變成金色頭髮..."
                                    className="w-full h-24 bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-pink-500 resize-none"
                                />
                                <button
                                    onClick={handleGenerate}
                                    disabled={!prompt.trim() || isGenerating}
                                    className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGenerating ? "✨ 魔法施展中..." : "✨ 生成修改"}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Main Canvas Area */}
                <div className="flex-1 bg-black/40 p-4 flex flex-col items-center justify-center overflow-auto relative">

                    {/* Working Canvas */}
                    {image && !resultImage && (
                        <div className="relative shadow-2xl rounded-lg overflow-hidden border border-white/10" ref={containerRef}>
                            <canvas
                                ref={canvasRef}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                className="cursor-crosshair touch-none max-w-full max-h-[80vh] w-auto h-auto"
                                style={{ aspectRatio: image ? `${image.width} / ${image.height}` : 'auto' }}
                            />
                            {!isDrawing && !isGenerating && (
                                <div className="absolute top-4 left-4 pointer-events-none bg-black/50 text-white text-xs px-2 py-1 rounded">
                                    👇 直接在圖片上塗抹要修改的地方
                                </div>
                            )}
                            {isGenerating && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                                    <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                    <span className="text-sm font-medium animate-pulse">AI 正在重繪您的圖片...</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Result View */}
                    {resultImage && (
                        <div className="relative shadow-2xl rounded-lg overflow-hidden border border-white/10 max-w-full max-h-[80vh]">
                            <img src={resultImage} alt="Result" className="max-w-full max-h-[80vh] object-contain" />
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                                <button
                                    onClick={() => setResultImage(null)}
                                    className="bg-black/60 hover:bg-black/80 text-white px-4 py-2 rounded-full backdrop-blur-md transition-all text-sm"
                                >
                                    ↩️ 繼續修改
                                </button>
                                <a
                                    href={resultImage}
                                    download="magic-canvas-result.png"
                                    className="bg-pink-600/80 hover:bg-pink-500/90 text-white px-4 py-2 rounded-full backdrop-blur-md transition-all text-sm font-bold shadow-lg shadow-pink-500/20"
                                >
                                    💾 下載成果
                                </a>
                            </div>
                        </div>
                    )}

                    {!image && (
                        <div className="text-gray-500 text-center">
                            <div className="text-6xl mb-4 opacity-20">🎨</div>
                            <p>請先由左側上傳圖片</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
