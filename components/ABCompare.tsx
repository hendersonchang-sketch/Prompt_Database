"use client";
import { useState, useRef } from "react";

interface ABCompareProps {
    imageA: string;
    imageB: string;
    labelA?: string;
    labelB?: string;
    onClose: () => void;
}

export default function ABCompare({ imageA, imageB, labelA = "圖 A", labelB = "圖 B", onClose }: ABCompareProps) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleMove = (clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPosition(percentage);
    };

    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) handleMove(e.clientX);
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        handleMove(e.touches[0].clientX);
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white/70 hover:text-white transition-colors z-50"
            >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div className="max-w-4xl w-full">
                {/* Labels */}
                <div className="flex justify-between mb-4 text-sm text-gray-400">
                    <span className="px-3 py-1 bg-blue-600/30 rounded-full">{labelA}</span>
                    <span className="px-3 py-1 bg-green-600/30 rounded-full">{labelB}</span>
                </div>

                {/* Comparison Container */}
                <div
                    ref={containerRef}
                    className="relative w-full aspect-square rounded-xl overflow-hidden cursor-col-resize select-none"
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onTouchMove={handleTouchMove}
                >
                    {/* Image B (Background - right side) */}
                    <img
                        src={imageB}
                        alt="Image B"
                        className="absolute inset-0 w-full h-full object-contain"
                        draggable={false}
                    />

                    {/* Image A (Foreground - left side with clip) */}
                    <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${sliderPosition}%` }}
                    >
                        <img
                            src={imageA}
                            alt="Image A"
                            className="absolute inset-0 w-full h-full object-contain"
                            style={{ width: `${containerRef.current?.offsetWidth || 0}px` }}
                            draggable={false}
                        />
                    </div>

                    {/* Slider Line */}
                    <div
                        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize"
                        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                    >
                        {/* Slider Handle */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <p className="text-center text-gray-500 text-sm mt-4">
                    👆 拖動滑桿左右比較兩張圖片
                </p>
            </div>
        </div>
    );
}
