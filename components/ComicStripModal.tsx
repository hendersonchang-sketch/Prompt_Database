"use client";

import { useState } from "react";

interface ComicStripModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ComicPanel {
    panelNumber: number;
    description: string;
    caption: string;
    imageUrl?: string;
    error?: string;
    prompt?: string;
}

export default function ComicStripModal({ isOpen, onClose }: ComicStripModalProps) {
    const [story, setStory] = useState("");
    const [style, setStyle] = useState("Manga");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [panels, setPanels] = useState<ComicPanel[]>([]);

    const styles = ["Manga", "American Comic", "Noir", "Pixel Art", "Watercolor", "Cyberpunk", "Disney 3D"];

    const handleGenerate = async () => {
        if (!story.trim()) return;
        setLoading(true);
        setPanels([]); // Clear previous

        try {
            const apiKey = localStorage.getItem('geminiApiKey');
            const response = await fetch('/api/comic-gen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ story, style, apiKey })
            });
            const data = await response.json();

            if (data.error) throw new Error(data.error);
            setPanels(data.panels || []);
        } catch (err: any) {
            console.error(err);
            alert("Comic Gen Failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAll = async () => {
        if (panels.length === 0) return;
        setSaving(true);
        try {
            const response = await fetch('/api/comic-gen', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    panels: panels,
                    tags: `comic, ${style}, ${story.substring(0, 10)}`
                })
            });
            if (!response.ok) throw new Error("Save failed");
            alert("Saved all panels to Gallery!");
        } catch (err) {
            alert("Failed to save panels");
        } finally {
            setSaving(false);
        }
    };

    const handleDownload = (url: string, name: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-[#1A1206]/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-6xl h-[90vh] flex gap-4">

                {/* Left: Inputs */}
                <div className="w-1/4 bg-[#1A1206] border border-amber-700/40 rounded-2xl p-6 flex flex-col">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-600 mb-6 flex items-center gap-2">
                        🎨 Comic Gen
                    </h2>

                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Story / Scenario</label>
                            <textarea
                                value={story}
                                onChange={e => setStory(e.target.value)}
                                placeholder="A space explorer finds a tiny dragon on Mars..."
                                className="w-full h-32 bg-[#0F0A05] border border-amber-700/40 rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-amber-500 resize-none"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Art Style</label>
                            <select
                                value={style}
                                onChange={e => setStyle(e.target.value)}
                                className="w-full bg-[#0F0A05] border border-amber-700/40 rounded-lg p-2 text-gray-200 text-sm"
                            >
                                {styles.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={loading || !story.trim()}
                            className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                        >
                            {loading ? "Generating..." : "Create Comic"}
                        </button>
                    </div>

                    <button onClick={onClose} className="mt-auto text-gray-500 hover:text-white text-sm">Close</button>
                </div>

                {/* Right: Comic Scrolly Area */}
                <div className="flex-1 bg-[#FDF5E6] border border-amber-700/40 rounded-2xl p-8 overflow-y-auto relative bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]">
                    {/* Comic Title */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-black text-[#2D1B0E] uppercase tracking-widest border-b-4 border-[#2D1B0E] inline-block pb-2 transform -rotate-1">
                            THE STORY
                        </h1>
                    </div>

                    {panels.length === 0 && !loading && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <span className="text-6xl mb-4 opacity-20">💬</span>
                            <p>Enter a story to begin...</p>
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-[#2D1B0E] font-bold animate-pulse">Drawing your comic...</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 auto-rows-fr">
                        {panels.map((panel) => (
                            <div key={panel.panelNumber} className="border-4 border-[#2D1B0E] bg-white p-2 shadow-[8px_8px_0px_0px_rgba(45,27,14,1)] hover:transform hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(45,27,14,1)] transition-all">
                                {/* Image Area */}
                                <div className="aspect-square bg-gray-100 border-2 border-[#2D1B0E] mb-2 overflow-hidden relative">
                                    {panel.imageUrl ? (
                                        <img src={panel.imageUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-red-500 font-bold">
                                            {panel.error || "Image Failed"}
                                        </div>
                                    )}
                                    {/* Panel Number Badge */}
                                    <div className="absolute top-0 left-0 bg-amber-400 border-r-2 border-b-2 border-[#2D1B0E] px-2 py-1 font-black text-xs text-[#2D1B0E]">
                                        #{panel.panelNumber}
                                    </div>
                                </div>

                                {/* Caption Bubble */}
                                <div className="bg-white border-2 border-[#2D1B0E] p-3 rounded-[50%_10%_40%_10%] relative min-h-[60px] flex items-center justify-center text-center">
                                    <p className="font-comic text-sm font-bold text-[#2D1B0E] leading-tight">
                                        {panel.caption}
                                    </p>
                                </div>
                                <button
                                    onClick={() => panel.imageUrl && handleDownload(panel.imageUrl, `panel-${panel.panelNumber}.png`)}
                                    className="w-full mt-2 py-1 bg-gray-200 hover:bg-gray-300 text-xs font-bold text-gray-700 transition-colors uppercase tracking-wider"
                                >
                                    Download
                                </button>
                            </div>
                        ))}
                    </div>

                    {panels.length > 0 && (
                        <div className="text-center mt-8">
                            <button
                                onClick={handleSaveAll}
                                disabled={saving}
                                className="px-8 py-3 bg-[#2D1B0E] text-amber-100 font-black uppercase text-xl hover:scale-105 transition-transform shadow-[6px_6px_0px_0px_rgba(217,119,6,1)] disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Save All to Gallery"}
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {/* Font Loader for 'Comic' effect (optional, or use standard sans) */}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap');
                .font-comic { font-family: 'Comic Neue', cursive; }
            `}</style>
        </div>
    );
}
