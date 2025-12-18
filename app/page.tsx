"use client";

import { useState, useEffect } from "react";
import PromptForm from "@/components/PromptForm";
import PromptGallery from "@/components/PromptGallery";
import ServerStatus from "@/components/ServerStatus";
import PromptLabModal from "@/components/PromptLabModal";
import InspirationMap from "@/components/InspirationMap";
import StoryboardModal from "@/components/StoryboardModal";
import MagicCanvas from "@/components/MagicCanvas";
import StyleTunerModal from "@/components/StyleTunerModal";
import BatchImportModal from "@/components/BatchImportModal";
import AutoRefinerModal from "@/components/AutoRefinerModal";
import ComicStripModal from "@/components/ComicStripModal";
import StickerMakerModal from "@/components/StickerMakerModal";
import MemeGeneratorModal from "@/components/MemeGeneratorModal";
import ImageEditor from "@/components/ImageEditor";
import MoodSliderModal from "@/components/MoodSliderModal";
import DNACompareModal from "@/components/DNACompareModal";
import ExplodedViewModal from "@/components/ExplodedViewModal";
import Img2ImgModal from "@/components/Img2ImgModal";
import SmartTagModal from "@/components/SmartTagModal";
import FaceSwapModal from "@/components/FaceSwapModal";

export default function Home() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [reuseData, setReuseData] = useState<any>(null);
    const [showChangelog, setShowChangelog] = useState(false);
    const [changelog, setChangelog] = useState<string>("");
    const [showPromptLab, setShowPromptLab] = useState(false);
    const [showInspirationMap, setShowInspirationMap] = useState(false);
    const [showStoryboard, setShowStoryboard] = useState(false);
    const [showMagicCanvas, setShowMagicCanvas] = useState(false);
    const [showStyleTuner, setShowStyleTuner] = useState(false);
    const [showBatchImport, setShowBatchImport] = useState(false);
    const [showAutoRefiner, setShowAutoRefiner] = useState(false);
    const [showComicStrip, setShowComicStrip] = useState(false);
    const [showStickerMaker, setShowStickerMaker] = useState(false);
    const [showMemeGod, setShowMemeGod] = useState(false);
    const [showMoodSlider, setShowMoodSlider] = useState(false);
    const [showDNACompare, setShowDNACompare] = useState(false);
    const [showExplodedView, setShowExplodedView] = useState(false);
    const [showImg2Img, setShowImg2Img] = useState(false);
    const [showSmartTag, setShowSmartTag] = useState(false);
    const [showFaceSwap, setShowFaceSwap] = useState(false);
    const [moodSliderPrompt, setMoodSliderPrompt] = useState('');
    const [editorImage, setEditorImage] = useState<string | null>(null);
    const [editorInitialText, setEditorInitialText] = useState<string | undefined>(undefined);

    // Load changelog
    useEffect(() => {
        if (showChangelog && !changelog) {
            fetch('/CHANGELOG.md')
                .then(res => res.text())
                .then(text => setChangelog(text))
                .catch(() => setChangelog('無法載入更新日誌'));
        }
    }, [showChangelog, changelog]);

    const handleSuccess = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    const handleUsePrompt = (prompt: string) => {
        setReuseData({
            prompt: prompt,
            // Keep defaults
            width: 1024,
            height: 1024,
            steps: 25,
            cfgScale: 7.0,
            seed: -1
        });
        setShowPromptLab(false);
        setShowInspirationMap(false);
        setShowStoryboard(false);
        setShowMagicCanvas(false);
        setShowStyleTuner(false);
        setShowBatchImport(false);
        setShowAutoRefiner(false);
        setShowComicStrip(false);
        setShowStickerMaker(false);
        setShowMemeGod(false);
        setEditorImage(null);
    };

    // Helper Component for Navigation Cards
    const NavCard = ({ label, emoji, onClick, active = false, accent = "gray", small = false }: any) => {
        const accentMap: any = {
            purple: {
                active: 'bg-purple-500/20 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.2)]',
                indicator: 'bg-purple-500'
            },
            blue: {
                active: 'bg-blue-500/20 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]',
                indicator: 'bg-blue-500'
            },
            violet: {
                active: 'bg-violet-500/20 border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.2)]',
                indicator: 'bg-violet-500'
            },
            cyan: {
                active: 'bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]',
                indicator: 'bg-cyan-500'
            },
            gray: {
                active: 'bg-white/20 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)]',
                indicator: 'bg-gray-400'
            }
        };

        const currentAccent = accentMap[accent] || accentMap.gray;

        return (
            <button
                onClick={onClick}
                className={`
                    flex flex-col items-center justify-center transition-all relative overflow-hidden
                    ${small ? 'p-2 rounded-xl text-[10px]' : 'p-4 rounded-2xl text-xs'}
                    ${active
                        ? `${currentAccent.active} text-white`
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'}
                    border group
                `}
            >
                <span className={`${small ? 'text-lg' : 'text-2xl'} mb-1 group-hover:scale-110 transition-transform`}>
                    {emoji}
                </span>
                <span className="font-medium truncate w-full text-center">{label}</span>
                {active && <div className={`absolute bottom-0 inset-x-0 h-1 ${currentAccent.indicator}`} />}
            </button>
        );
    };


    return (
        <main className="min-h-screen flex flex-col items-center py-6 md:py-12 gap-8 md:gap-12 px-4">
            <div className="text-center space-y-1 md:space-y-2 mb-2">
                <h1 className="text-3xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-600 tracking-tight">
                    Prompt Database
                </h1>
                <p className="text-gray-400 text-xs md:text-base font-medium">打造您的專屬提示詞庫</p>
            </div>

            {/* --- 功能導覽區開始 --- */}
            <div className="w-full max-w-5xl space-y-10 px-4 mb-12">

                {/* 1. 核心創作 - 較大、有漸層感 */}
                <div>
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">✨ 核心創作</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <NavCard
                            label="Prompt 實驗室" emoji="🧪"
                            active={showPromptLab}
                            onClick={() => setShowPromptLab(true)}
                            accent="purple"
                        />
                        <NavCard
                            label="Magic Canvas" emoji="🖌️"
                            active={showMagicCanvas}
                            onClick={() => setShowMagicCanvas(true)}
                            accent="blue"
                        />
                        <NavCard
                            label="AI 換臉" emoji="🎭"
                            active={showFaceSwap}
                            onClick={() => setShowFaceSwap(!showFaceSwap)}
                            accent="violet"
                        />
                        <NavCard
                            label="風格調校" emoji="⚖️"
                            active={showStyleTuner}
                            onClick={() => setShowStyleTuner(true)}
                            accent="cyan"
                        />
                    </div>
                </div>

                {/* 2. 進階工具 - 標準網格 */}
                <div>
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">🚀 進階工具</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        <NavCard label="靈感地圖" emoji="🕸️" active={showInspirationMap} onClick={() => setShowInspirationMap(true)} accent="pink" />
                        <NavCard label="故事板" emoji="🎬" active={showStoryboard} onClick={() => setShowStoryboard(true)} accent="yellow" />
                        <NavCard label="四格漫畫" emoji="💬" active={showComicStrip} onClick={() => setShowComicStrip(true)} accent="pink" />
                        <NavCard label="圖生圖" emoji="🖼️" active={showImg2Img} onClick={() => setShowImg2Img(true)} accent="pink" />
                        <NavCard label="梗圖大師" emoji="🤡" active={showMemeGod} onClick={() => setShowMemeGod(true)} accent="orange" />
                        {/* 加入缺失的功能 */}
                        <NavCard label="Auto Agent" emoji="🤖" active={showAutoRefiner} onClick={() => setShowAutoRefiner(true)} accent="blue" />
                    </div>
                </div>

                {/* 3. 實用輔助 - 較小、簡約 */}
                <div>
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 px-2">🛠️ 實用輔助</h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        <NavCard small label="批量匯入" emoji="📥" active={showBatchImport} onClick={() => setShowBatchImport(true)} accent="green" />
                        <NavCard small label="智能標籤" emoji="🏷️" active={showSmartTag} onClick={() => setShowSmartTag(true)} accent="emerald" />
                        <NavCard small label="DNA 比較" emoji="🧬" active={showDNACompare} onClick={() => setShowDNACompare(true)} accent="cyan" />
                        <NavCard small label="零件拆解" emoji="📦" active={showExplodedView} onClick={() => setShowExplodedView(true)} accent="amber" />
                        <NavCard small label="情緒滑桿" emoji="🎨" active={showMoodSlider} onClick={() => setShowMoodSlider(true)} accent="purple" />
                        <NavCard small label="更新日誌" emoji="📋" active={showChangelog} onClick={() => setShowChangelog(true)} accent="gray" />
                        {/* 加入缺失的功能 */}
                        <NavCard small label="貼圖製造" emoji="🏷️" active={showStickerMaker} onClick={() => setShowStickerMaker(true)} accent="green" />
                    </div>
                </div>
            </div>
            {/* --- 功能導覽區結束 --- */}

            <PromptLabModal
                isOpen={showPromptLab}
                onClose={() => setShowPromptLab(false)}
                onUsePrompt={handleUsePrompt}
            />

            <PromptForm onSuccess={handleSuccess} initialData={reuseData} />

            <div className="w-full border-t border-white/10" />

            <PromptGallery
                refreshTrigger={refreshTrigger}
                onReuse={setReuseData}
            />

            {/* Server Status Indicator */}
            <ServerStatus />

            {/* Changelog Modal */}
            {showChangelog && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowChangelog(false)}
                >
                    <div
                        className="bg-gray-900 border border-white/20 rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-4 border-b border-white/10">
                            <h2 className="text-lg font-bold text-white">📋 程式修改日誌</h2>
                            <button
                                onClick={() => setShowChangelog(false)}
                                className="text-gray-500 hover:text-white text-2xl"
                            >×</button>
                        </div>
                        <div className="overflow-y-auto p-4 prose prose-invert prose-sm max-w-none">
                            <pre className="whitespace-pre-wrap text-xs text-gray-300 font-mono leading-relaxed">
                                {changelog || '載入中...'}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {/* Inspiration Map Modal */}
            {showInspirationMap && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
                    onClick={() => setShowInspirationMap(false)}
                >
                    <div
                        className="bg-gray-900 border border-white/20 rounded-2xl w-full max-w-5xl h-[80vh] flex flex-col relative"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-4 border-b border-white/10 shrink-0">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                🕸️ 靈感地圖
                                <span className="text-xs font-normal text-gray-400 bg-white/10 px-2 py-0.5 rounded">Beta</span>
                            </h2>
                            <button
                                onClick={() => setShowInspirationMap(false)}
                                className="text-gray-500 hover:text-white text-2xl"
                            >×</button>
                        </div>
                        <div className="flex-1 overflow-hidden relative p-4">
                            <InspirationMap onSelect={handleUsePrompt} />
                        </div>
                        <div className="p-4 border-t border-white/10 text-center text-xs text-gray-500">
                            點擊節點可直接將 Prompt 帶入輸入框
                        </div>
                    </div>
                </div>
            )}

            {/* AI Storyboard Modal */}
            <StoryboardModal isOpen={showStoryboard} onClose={() => setShowStoryboard(false)} />

            {/* Magic Canvas Modal */}
            <MagicCanvas isOpen={showMagicCanvas} onClose={() => setShowMagicCanvas(false)} />

            {/* Style Tuner Modal */}
            <StyleTunerModal isOpen={showStyleTuner} onClose={() => setShowStyleTuner(false)} />

            {/* Batch Import Modal */}
            <BatchImportModal isOpen={showBatchImport} onClose={() => setShowBatchImport(false)} />

            {/* Auto Refiner Modal */}
            <AutoRefinerModal isOpen={showAutoRefiner} onClose={() => setShowAutoRefiner(false)} />

            {/* Comic Strip Modal */}
            <ComicStripModal isOpen={showComicStrip} onClose={() => setShowComicStrip(false)} />

            {/* Sticker Maker Modal */}
            <StickerMakerModal isOpen={showStickerMaker} onClose={() => setShowStickerMaker(false)} />

            {/* Image Editor */}
            <ImageEditor
                isOpen={!!editorImage}
                onClose={() => {
                    setEditorImage(null);
                    setEditorInitialText(undefined); // Clear initial text
                }}
                initialImageUrl={editorImage}
                initialText={editorInitialText}
            />
            {/* Meme God Modal */}
            <MemeGeneratorModal
                isOpen={showMemeGod}
                onClose={() => setShowMemeGod(false)}
                onEdit={(url, caption) => {
                    setEditorImage(url);
                    setEditorInitialText(caption);
                    setShowMemeGod(false);
                }}
            />

            {/* Mood Slider Modal */}
            <MoodSliderModal
                isOpen={showMoodSlider}
                onClose={() => setShowMoodSlider(false)}
                initialPrompt={moodSliderPrompt}
                onApply={(newPrompt) => {
                    handleUsePrompt(newPrompt);
                    setShowMoodSlider(false);
                }}
            />

            {/* DNA Compare Modal */}
            <DNACompareModal
                isOpen={showDNACompare}
                onClose={() => setShowDNACompare(false)}
            />

            {/* Exploded View Modal */}
            <ExplodedViewModal
                isOpen={showExplodedView}
                onClose={() => setShowExplodedView(false)}
                onUsePrompt={handleUsePrompt}
            />

            {/* Img2Img Modal */}
            <Img2ImgModal
                isOpen={showImg2Img}
                onClose={() => setShowImg2Img(false)}
            />

            {/* Smart Tag Modal */}
            <SmartTagModal
                isOpen={showSmartTag}
                onClose={() => setShowSmartTag(false)}
            />

            {/* Face Swap Modal */}
            <FaceSwapModal
                isOpen={showFaceSwap}
                onClose={() => setShowFaceSwap(false)}
            />
        </main>
    );
}
