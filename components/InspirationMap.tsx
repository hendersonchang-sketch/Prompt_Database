"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface InspirationMapProps {
    onSelect: (promptId: string) => void;
}

export default function InspirationMap({ onSelect }: InspirationMapProps) {
    const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        // Resize observer
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight || 600
            });
        }
    }, [containerRef]);

    useEffect(() => {
        fetchGraphData();
    }, []);

    const fetchGraphData = async () => {
        try {
            const res = await fetch('/api/inspiration-graph?limit=100&threshold=0.7');
            const data = await res.json();

            // Preload images
            data.nodes.forEach((node: any) => {
                const img = new Image();
                img.src = node.img;
                node.imgObj = img;
            });

            setGraphData(data);
        } catch (error) {
            console.error("Failed to load graph", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNodeClick = useCallback((node: any) => {
        onSelect(node.id);
    }, [onSelect]);

    return (
        <div ref={containerRef} className="w-full h-[600px] border border-white/10 rounded-xl overflow-hidden bg-black/40 relative">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center text-white/50 z-10">
                    載入靈感網絡中...
                </div>
            )}

            {!loading && (
                <ForceGraph2D
                    width={dimensions.width}
                    height={dimensions.height}
                    graphData={graphData}
                    nodeLabel="name"
                    nodeRelSize={6}
                    linkColor={() => "rgba(255,255,255,0.2)"}
                    nodeCanvasObject={(node: any, ctx, globalScale) => {
                        const size = 12;

                        // Draw Image
                        if (node.imgObj && node.imgObj.complete) {
                            ctx.save();
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
                            ctx.clip();
                            try {
                                ctx.drawImage(node.imgObj, node.x - size, node.y - size, size * 2, size * 2);
                            } catch (e) {
                                // Fallback color
                                ctx.fillStyle = '#666';
                                ctx.fill();
                            }
                            ctx.restore();
                        } else {
                            // Placeholder
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
                            ctx.fillStyle = '#444';
                            ctx.fill();
                        }

                        // Border
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
                        ctx.strokeStyle = '#fff';
                        ctx.lineWidth = 1 / globalScale;
                        ctx.stroke();

                        // Label on hover (handled by library default tooltips usually, but we can draw text)
                        // Only draw label if highlighted? ForceGraph handles nodeLabel prop for tooltips.
                    }}
                    onNodeClick={handleNodeClick}
                    backgroundColor="rgba(0,0,0,0)"
                />
            )}

            <div className="absolute top-4 left-4 bg-black/60 p-2 rounded text-xs text-gray-300">
                🕸️ 顯示最近 100 張圖片的語義關聯 (相似度 &gt; 0.7)
            </div>
        </div>
    );
}
