"use client";

import { useState, useRef, useEffect } from "react";

interface TextObject {
    id: number;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    color: string; // Hex color
    fontFamily: string; // Font family
    isDragging: boolean;
}

const FONTS = [
    { name: "Default (Sans)", value: "Arial, sans-serif" },
    { name: "Impact (Meme)", value: "Impact, Arial, sans-serif" },
    { name: "Noto Sans (TC)", value: "'Noto Sans TC', sans-serif" },
    { name: "Comic Sans", value: "'Comic Sans MS', cursive, sans-serif" },
    { name: "Serif", value: "Georgia, serif" },
];

interface ImageEditorProps {
    isOpen: boolean;
    onClose: () => void;
    initialImageUrl: string | null;
    initialDiscussion?: string; // Optional context for AI
    initialText?: string; // Optional initial text (e.g. meme caption)
}

export default function ImageEditor({ isOpen, onClose, initialImageUrl, initialText }: ImageEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [texts, setTexts] = useState<TextObject[]>([]);
    const [selectedTextId, setSelectedTextId] = useState<number | null>(null);
    const [inputText, setInputText] = useState("");
    const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
    const [currentStyle, setCurrentStyle] = useState({ color: "#ffffff", size: 40, fontFamily: FONTS[1].value });

    // Load Image
    useEffect(() => {
        if (!initialImageUrl) return;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = initialImageUrl;
        img.onload = () => {
            setImageObj(img);
            // Fit canvas to window or fix max width, maintaining aspect
            const maxWidth = 800;
            const maxHeight = 600;
            let w = img.width;
            let h = img.height;

            if (w > maxWidth || h > maxHeight) {
                const ratio = Math.min(maxWidth / w, maxHeight / h);
                w *= ratio;
                h *= ratio;
            }
            setCanvasSize({ width: w, height: h });

            // Initialize text if provided and canvas size is known
            if (initialText) {
                setTexts([{
                    id: Date.now(),
                    text: initialText,
                    x: w / 2,
                    y: h * 0.85, // Position at bottom by default for memes
                    fontSize: 50,
                    color: "#ffffff",
                    fontFamily: FONTS[1].value, // Default to Impact for memes
                    isDragging: false
                }]);
            } else {
                setTexts([]); // Reset if no initial text
            }
        };
    }, [initialImageUrl, initialText]);

    // Draw Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageObj) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

        // Draw Image
        ctx.drawImage(imageObj, 0, 0, canvasSize.width, canvasSize.height);

        // Draw Texts
        texts.forEach(t => {
            ctx.font = `bold ${t.fontSize}px ${t.fontFamily}`;
            ctx.fillStyle = t.color;
            ctx.strokeStyle = "black";
            ctx.lineWidth = t.fontSize / 15;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.strokeText(t.text, t.x, t.y);
            ctx.fillText(t.text, t.x, t.y);

            // Selection Box (Optional)
            if (t.id === selectedTextId) {
                ctx.strokeStyle = "cyan";
                ctx.lineWidth = 1;
                const metrics = ctx.measureText(t.text);
                const w = metrics.width + 20;
                const h = t.fontSize * 1.2;
                ctx.strokeRect(t.x - w / 2, t.y - h / 2, w, h);
            }
        });

    }, [imageObj, texts, canvasSize, selectedTextId]);

    // Add Text
    const addText = () => {
        const newText: TextObject = {
            id: Date.now(),
            text: inputText || "SAMPLE TEXT",
            x: canvasSize.width / 2,
            y: canvasSize.height / 2,
            fontSize: currentStyle.size,
            color: currentStyle.color,
            fontFamily: currentStyle.fontFamily,
            isDragging: false
        };
        setTexts([...texts, newText]);
        setSelectedTextId(newText.id);
        setInputText("");
    };

    // Mouse Events for Dragging
    const getEvtPos = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const pos = getEvtPos(e);
        // Check hit
        // Simplified hit detection
        for (let i = texts.length - 1; i >= 0; i--) {
            const t = texts[i];
            const metrics = canvasRef.current?.getContext("2d")?.measureText(t.text);
            const w = (metrics?.width || 100) / 2;
            const h = t.fontSize / 2;

            if (pos.x >= t.x - w && pos.x <= t.x + w && pos.y >= t.y - h && pos.y <= t.y + h) {
                setSelectedTextId(t.id);
                // Move to top
                const newTexts = [...texts];
                newTexts.splice(i, 1);
                newTexts.push({ ...t, isDragging: true });
                setTexts(newTexts);
                return;
            }
        }
        setSelectedTextId(null);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const pos = getEvtPos(e);
        const canvas = canvasRef.current;

        // Handle Dragging
        const dragging = texts.find(t => t.isDragging);
        if (dragging) {
            setTexts(texts.map(t => t.id === dragging.id ? { ...t, x: pos.x, y: pos.y } : t));
            if (canvas) canvas.style.cursor = 'grabbing';
            return;
        }

        // Handle Hover Cursor
        if (!canvas) return;
        let hit = false;
        // Check fit in reverse order (top on top)
        for (let i = texts.length - 1; i >= 0; i--) {
            const t = texts[i];
            const ctx = canvas.getContext("2d");
            if (!ctx) continue;
            const metrics = ctx.measureText(t.text);
            const w = (metrics.width + 20) / 2;
            const h = t.fontSize / 2;

            if (pos.x >= t.x - w && pos.x <= t.x + w && pos.y >= t.y - h && pos.y <= t.y + h) {
                hit = true;
                break;
            }
        }
        canvas.style.cursor = hit ? 'grab' : 'default';
    };

    const handleMouseUp = () => {
        const canvas = canvasRef.current;
        if (canvas) canvas.style.cursor = 'default';
        setTexts(texts.map(t => ({ ...t, isDragging: false })));
    };

    // Update Selected Text
    const updateSelected = (prop: Partial<TextObject>) => {
        if (!selectedTextId) return;
        setTexts(texts.map(t => t.id === selectedTextId ? { ...t, ...prop } : t));
    };

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const url = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.download = `edited-image-${Date.now()}.png`;
        link.href = url;
        link.click();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="flex w-full max-w-6xl h-[90vh] gap-4">
                {/* Editor Area */}
                <div className="flex-1 bg-gray-900 rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden relative">
                    <canvas
                        ref={canvasRef}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        className="shadow-2xl"
                    />
                    {!imageObj && <div className="text-gray-500">Wait for image...</div>}
                </div>

                {/* Sidebar */}
                <div className="w-80 bg-gray-800 rounded-2xl p-6 flex flex-col gap-6 border border-white/10 overflow-y-auto">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">🎨 Editor</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                    </div>

                    {/* Add Text */}
                    <div className="space-y-4 p-4 bg-gray-700/50 rounded-xl">
                        <h3 className="text-sm font-bold text-gray-300">Add Caption</h3>
                        <div className="flex gap-2 items-center h-11">
                            <input
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                placeholder="Enter text..."
                                className="flex-1 h-full bg-black/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                            />
                            <button
                                onClick={addText}
                                className="h-full aspect-square bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xl flex items-center justify-center transition-colors"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Edit Selected */}
                    {selectedTextId && (
                        <div className="space-y-4 p-4 bg-gray-700/50 rounded-xl border border-purple-500/30 animate-pulse-border">
                            <h3 className="text-sm font-bold text-purple-300">Edit Selected</h3>
                            <div>
                                <label className="text-xs text-gray-400">Content</label>
                                <input
                                    value={texts.find(t => t.id === selectedTextId)?.text || ""}
                                    onChange={e => updateSelected({ text: e.target.value })}
                                    className="w-full bg-black/50 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                                />
                            </div>

                            {/* Font Select */}
                            <div>
                                <label className="text-xs text-gray-400">Font</label>
                                <select
                                    value={texts.find(t => t.id === selectedTextId)?.fontFamily || FONTS[0].value}
                                    onChange={e => updateSelected({ fontFamily: e.target.value })}
                                    className="w-full bg-black/50 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                                >
                                    {FONTS.map(f => (
                                        <option key={f.value} value={f.value}>{f.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-xs text-gray-400">Size</label>
                                    <input
                                        type="range" min="10" max="100"
                                        value={texts.find(t => t.id === selectedTextId)?.fontSize || 40}
                                        onChange={e => updateSelected({ fontSize: Number(e.target.value) })}
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400">Color</label>
                                    <input
                                        type="color"
                                        value={texts.find(t => t.id === selectedTextId)?.color || "#ffffff"}
                                        onChange={e => updateSelected({ color: e.target.value })}
                                        className="block w-8 h-8 rounded cursor-pointer"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setTexts(texts.filter(t => t.id !== selectedTextId));
                                    setSelectedTextId(null);
                                }}
                                className="w-full py-1 bg-red-500/20 text-red-400 border border-red-500/50 rounded text-xs"
                            >
                                Delete Layer
                            </button>
                        </div>
                    )}

                    <div className="mt-auto space-y-3">
                        <button
                            onClick={handleDownload}
                            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform"
                        >
                            Download PNG
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
