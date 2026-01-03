"use client";

import { useState, useRef } from "react";
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
    const c1 = Math.floor(Math.abs(Math.sin(hash) * 16777215)).toString(16).padStart(6, '0');
    const c2 = Math.floor(Math.abs(Math.cos(hash) * 16777215)).toString(16).padStart(6, '0');
    return `linear-gradient(135deg, #${c1}15 0%, #${c2}15 100%)`;
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
    const cardRef = useRef<HTMLDivElement>(null);

    // 3D Tilt Effect
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;

        cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };

    const handleMouseLeave = () => {
        if (!cardRef.current) return;
        cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    };

    const aspectRatio = item.width && item.height ? (item.height / item.width) * 100 : 100;

    return (
        <div
            ref={cardRef}
            onClick={() => {
                if (isSelectionMode) {
                    onToggleSelection(item.id);
                } else {
                    onSelect(item);
                }
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            draggable="true"
            onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", item.id);
                if (item.imageUrl) {
                    e.dataTransfer.setData("image/url", item.imageUrl);
                }
                e.dataTransfer.effectAllowed = "copy";
            }}
            style={{ transformStyle: 'preserve-3d', transition: 'transform 0.15s ease-out, box-shadow 0.3s ease' }}
            className={`
                break-inside-avoid group relative cursor-pointer
                bg-gradient-to-br from-white/[0.08] to-white/[0.02]
                backdrop-blur-xl rounded-2xl overflow-hidden
                border transition-all duration-300
                ${isSelected
                    ? "border-2 border-purple-400 shadow-[0_0_40px_rgba(168,85,247,0.5),inset_0_0_30px_rgba(168,85,247,0.1)]"
                    : "border-white/10 hover:border-purple-500/50 hover:shadow-[0_8px_40px_rgba(168,85,247,0.25),0_0_60px_rgba(59,130,246,0.15)]"
                }
            `}
        >
            {/* Glassmorphism Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 pointer-events-none z-0" />

            {/* Selection Checkbox */}
            {isSelectionMode && (
                <div className="absolute top-3 left-3 z-30">
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all backdrop-blur-sm ${isSelected
                        ? "bg-purple-500 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.8)]"
                        : "bg-black/30 border-white/40 group-hover:border-white group-hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                        }`}>
                        {isSelected && (
                            <svg className="w-4 h-4 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                {/* Shimmer Loading Effect */}
                {!imageLoaded && (
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"
                            style={{ animation: 'shimmer 2s infinite' }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <ImageIcon className="w-10 h-10 text-white/10" />
                        </div>
                    </div>
                )}

                {item.imageUrl && (
                    <Image
                        src={item.imageUrl}
                        alt={item.prompt}
                        width={item.width || 1024}
                        height={item.height || 1024}
                        onLoad={() => setImageLoaded(true)}
                        className={`w-full h-auto object-cover transition-all duration-700 group-hover:scale-[1.08] ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        loading="lazy"
                        unoptimized={true}
                    />
                )}

                {/* Favorite Badge with Glow */}
                {item.isFavorite && (
                    <div className="absolute top-3 right-3 z-20">
                        <div className="relative">
                            <Heart className="w-6 h-6 text-pink-500 fill-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]" />
                            <div className="absolute inset-0 animate-ping">
                                <Heart className="w-6 h-6 text-pink-400 fill-pink-400 opacity-50" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>

            {/* Bottom Glass Panel */}
            <div className="relative p-4 space-y-3 bg-gradient-to-t from-black/60 via-black/40 to-transparent backdrop-blur-md border-t border-white/5">
                {/* Prompt Preview */}
                <p className="text-sm text-white/90 line-clamp-2 leading-relaxed font-medium">
                    {item.promptZh || item.prompt}
                </p>

                {/* Tags with Neon Effect */}
                {item.tags && (
                    <div className="flex flex-wrap gap-1.5">
                        {item.tags.split(',').slice(0, 4).map((tag, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTagClick?.(tag.trim());
                                }}
                                className="text-[11px] px-2.5 py-1 rounded-full 
                                    bg-purple-500/20 text-purple-200 
                                    border border-purple-500/30
                                    hover:bg-purple-500/40 hover:border-purple-400 hover:text-white
                                    hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]
                                    transition-all duration-200"
                            >
                                {tag.trim()}
                            </button>
                        ))}
                    </div>
                )}

                {/* Action Row with Neon Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-xs text-gray-400 font-mono">
                        {item.width}×{item.height}
                    </span>
                    <div className="flex gap-1.5">
                        {/* Favorite Toggle */}
                        <button
                            onClick={(e) => onToggleFavorite(e, item.id, item.isFavorite)}
                            className={`p-2 rounded-xl transition-all duration-200 ${item.isFavorite
                                ? "text-pink-400 bg-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                                : "text-gray-400 hover:text-pink-400 hover:bg-pink-500/20 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                                }`}
                            title={item.isFavorite ? "取消收藏" : "加入收藏"}
                        >
                            <Heart className={`w-4 h-4 ${item.isFavorite ? "fill-current" : ""}`} />
                        </button>

                        {/* Set as Reference */}
                        {handleSetAsReference && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetAsReference(item);
                                }}
                                className="p-2 rounded-xl text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-200"
                                title="設為參考圖"
                            >
                                <ImageIcon className="w-4 h-4" />
                            </button>
                        )}

                        {/* Set as Cover */}
                        {onSetAsCover && item.imageUrl && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSetAsCover(item.id, item.imageUrl!);
                                }}
                                className="p-2 rounded-xl text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/20 hover:shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all duration-200"
                                title="設為封面"
                            >
                                <ImagePlus className="w-4 h-4" />
                            </button>
                        )}

                        {/* Delete */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("確定要刪除這張圖片嗎？")) onDelete(item.id);
                            }}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-200"
                            title="刪除"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
