"use client";

import { useState } from "react";
import Image from "next/image";
import { Trash2, ImageIcon, Heart, ImagePlus } from "lucide-react";

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
    onSetAsCover?: (id: string, url: string) => void;
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
    onTagClick,
    onSetAsCover
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
            draggable="true"
            onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", item.id);
                if (item.imageUrl) {
                    e.dataTransfer.setData("image/url", item.imageUrl);
                }
                e.dataTransfer.effectAllowed = "copy";
            }}
            className={`break-inside-avoid group relative bg-neutral-900/60 backdrop-blur-sm rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer ${isSelected
                ? "border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                : "border-white/5 hover:border-white/20"
                }`}
        >
            {/* Selection Checkbox */}
            {isSelectionMode && (
                <div className="absolute top-3 left-3 z-20">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                        ? "bg-purple-500 border-purple-500 shadow-lg shadow-purple-500/50"
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

            {/* Image Container */}
            <div
                className="relative w-full overflow-hidden"
                style={{
                    paddingBottom: imageLoaded ? '0' : `${aspectRatio}%`,
                    background: imageLoaded ? 'transparent' : getDeterministicBackground(item.id)
                }}
            >
                {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-white/10" />
                    </div>
                )}

                {item.imageUrl && (
                    <Image
                        src={item.imageUrl}
                        alt={item.prompt}
                        width={item.width || 1024}
                        height={item.height || 1024}
                        onLoad={() => setImageLoaded(true)}
                        className={`w-full h-auto object-cover transition-all duration-500 group-hover:scale-[1.03] ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        loading="lazy"
                        unoptimized={true}
                    />
                )}

                {/* Favorite Badge - Always visible on image */}
                {item.isFavorite && (
                    <div className="absolute top-3 right-3 z-10">
                        <Heart className="w-5 h-5 text-pink-500 fill-pink-500 drop-shadow-lg" />
                    </div>
                )}
            </div>

            {/* Bottom Info Panel - Always Visible */}
            <div className="p-3 space-y-2 bg-neutral-900/80">
                {/* Prompt Preview */}
                <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                    {item.promptZh || item.prompt}
                </p>

                {/* Tags Row */}
                {item.tags && (
                    <div className="flex flex-wrap gap-1">
                        {item.tags.split(',').slice(0, 4).map((tag, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTagClick?.(tag.trim());
                                }}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 hover:bg-purple-500/30 hover:text-purple-200 transition-colors"
                            >
                                {tag.trim()}
                            </button>
                        ))}
                    </div>
                )}

                {/* Action Row */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <span className="text-[10px] text-gray-500">
                        {item.width}×{item.height}
                    </span>
                    <div className="flex gap-1">
                        {/* Favorite Toggle */}
                        <button
                            onClick={(e) => onToggleFavorite(e, item.id, item.isFavorite)}
                            className={`p-1.5 rounded-lg transition-all ${item.isFavorite
                                ? "text-pink-500 bg-pink-500/10"
                                : "text-gray-500 hover:text-pink-400 hover:bg-pink-500/10"
                                }`}
                            title={item.isFavorite ? "取消收藏" : "加入收藏"}
                        >
                            <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? "fill-current" : ""}`} />
                        </button>

                        {/* Set as Reference */}
                        {handleSetAsReference && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetAsReference(item);
                                }}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                                title="設為參考圖"
                            >
                                <ImageIcon className="w-3.5 h-3.5" />
                            </button>
                        )}

                        {/* Set as Cover (only in collection view) */}
                        {onSetAsCover && item.imageUrl && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSetAsCover(item.id, item.imageUrl!);
                                }}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all"
                                title="設為封面"
                            >
                                <ImagePlus className="w-3.5 h-3.5" />
                            </button>
                        )}

                        {/* Delete */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("確定要刪除這張圖片嗎？")) onDelete(item.id);
                            }}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="刪除"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
