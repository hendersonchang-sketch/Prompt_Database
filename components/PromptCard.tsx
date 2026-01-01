"use client";

import { useState } from "react";
import Image from "next/image";
import { Trash2, ImageIcon } from "lucide-react";

export interface PromptEntry {
    id: string;
    imageUrl: string | null;
    prompt: string;
    negativePrompt?: string | null;
    promptZh?: string | null;
    originalPrompt?: string | null;
    width: number;
    height: number;
    tags?: string;
    isFavorite: boolean;
    seed?: number;
    cfgScale?: number;
    steps?: number;
    sampler?: string;
    engine?: string;
    modelName?: string;
    createdAt: Date | string;
}

interface PromptCardProps {
    item: PromptEntry;
    isSelectionMode: boolean;
    isSelected: boolean;
    onToggleSelection: (id: string) => void;
    onSelect: (item: PromptEntry) => void;
    onToggleFavorite: (e: React.MouseEvent, id: string, current: boolean) => void;
    onDelete: (id: string) => void;
    handleSetAsReference?: (image: PromptEntry) => void;
    onTagClick?: (tag: string) => void;
}

// Generate a deterministic soft gradient based on string ID
function getDeterministicBackground(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate two colors
    const c1 = Math.floor(Math.abs(Math.sin(hash) * 16777215)).toString(16).padStart(6, '0');
    const c2 = Math.floor(Math.abs(Math.cos(hash) * 16777215)).toString(16).padStart(6, '0');

    // Return gradient style
    return `linear-gradient(135deg, #${c1}20 0%, #${c2}20 100%)`;
}

export function PromptCard({
    item,
    isSelectionMode,
    isSelected,
    onToggleSelection,
    onSelect,
    onToggleFavorite,
    onDelete,
    handleSetAsReference,
    onTagClick
}: PromptCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);

    // Calculate aspect ratio for the placeholder
    const aspectRatio = item.width && item.height ? (item.height / item.width) * 100 : 100;

    return (
        <div
            onClick={() => {
                if (isSelectionMode) {
                    onToggleSelection(item.id);
                } else {
                    onSelect(item);
                }
            }}
            className={`break-inside-avoid group relative bg-neutral-900/40 backdrop-blur-sm rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 cursor-pointer ${isSelected
                ? "border-red-500 shadow-lg shadow-red-500/20"
                : "border-white/5 hover:border-purple-500/50"
                }`}
        >
            {/* Selection Checkbox */}
            {isSelectionMode && (
                <div className="absolute top-3 left-3 z-20">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                        ? "bg-red-500 border-red-500"
                        : "bg-black/50 border-white/50 group-hover:border-white"
                        }`}>
                        {isSelected && (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                </div>
            )}

            {/* Image Container with Smart Placeholder */}
            <div
                className="relative w-full overflow-hidden transition-colors duration-500"
                style={{
                    paddingBottom: imageLoaded ? '0' : `${aspectRatio}%`,
                    background: imageLoaded ? 'transparent' : getDeterministicBackground(item.id)
                }}
            >
                {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                        <ImageIcon className="w-8 h-8 text-white/20" />
                    </div>
                )}

                {item.imageUrl && (
                    <Image
                        src={item.imageUrl}
                        alt={item.prompt}
                        width={item.width || 1024}
                        height={item.height || 1024}
                        onLoad={() => setImageLoaded(true)}
                        className={`w-full h-auto object-cover transition-opacity duration-700 group-hover:scale-105 transition-transform duration-700 ease-out ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        loading="lazy"
                        unoptimized={true}
                    />
                )}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end z-10">
                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-2">
                    {item.tags && item.tags.split(',').slice(0, 3).map((tag, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation();
                                onTagClick?.(tag.trim());
                            }}
                            className="text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm bg-white/10 text-white/80 hover:bg-purple-500 hover:text-white transition-colors"
                        >
                            {tag.trim()}
                        </button>
                    ))}
                </div>

                <p className="text-white text-xs line-clamp-2 font-medium mb-3">
                    {item.promptZh || item.prompt}
                </p>

                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">
                        {item.width}x{item.height}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => onToggleFavorite(e, item.id, item.isFavorite)}
                            className={`p-2 rounded-full transition-colors ${item.isFavorite ? "text-pink-500 bg-pink-500/10" : "text-white/50 hover:text-white hover:bg-white/10"}`}
                        >
                            <svg className={`w-4 h-4 ${item.isFavorite ? "fill-current" : "stroke-current fill-none"}`} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("確定要刪除這張圖片嗎？")) onDelete(item.id);
                            }}
                            className="p-2 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white rounded-full transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSetAsReference?.(item);
                            }}
                            title="設為參考圖"
                            className="p-2 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-200 hover:text-white rounded-full transition-colors"
                        >
                            <ImageIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
