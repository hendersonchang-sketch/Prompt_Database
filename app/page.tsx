"use client";

import { useState, useEffect } from "react";
import PromptForm from "@/components/PromptForm";
import PromptGallery from "@/components/PromptGallery";
import ServerStatus from "@/components/ServerStatus";
import BatchImportModal from "@/components/BatchImportModal";
import ImageEditor from "@/components/ImageEditor";
import SmartTagModal from "@/components/SmartTagModal";
import FaceSwapModal from "@/components/FaceSwapModal";

export default function Home() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [reuseData, setReuseData] = useState<any>(null);
    const [showChangelog, setShowChangelog] = useState(false);
    const [changelog, setChangelog] = useState<string>("");
    const [showBatchImport, setShowBatchImport] = useState(false);
    const [showSmartTag, setShowSmartTag] = useState(false);
    const [showFaceSwap, setShowFaceSwap] = useState(false);
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
        setShowBatchImport(false);
        setEditorImage(null);
    };

    // Helper Component for Navigation Cards - Alchemy Theme
    const NavCard = ({ label, emoji, onClick, active = false, accent = "gold", small = false }: any) => {
        const accentMap: any = {
            gold: {
                active: 'bg-amber-500/20 border-amber-500/50 shadow-[0_0_20px_rgba(212,175,55,0.3)]',
                indicator: 'bg-amber-500'
            },
            copper: {
                active: 'bg-orange-500/20 border-orange-500/50 shadow-[0_0_20px_rgba(184,115,51,0.3)]',
                indicator: 'bg-orange-600'
            },
            bronze: {
                active: 'bg-yellow-600/20 border-yellow-600/50 shadow-[0_0_20px_rgba(205,127,50,0.3)]',
                indicator: 'bg-yellow-600'
            },
            ember: {
                active: 'bg-red-500/20 border-red-500/50 shadow-[0_0_20px_rgba(255,107,53,0.3)]',
                indicator: 'bg-red-500'
            },
            parchment: {
                active: 'bg-amber-100/10 border-amber-200/30 shadow-[0_0_20px_rgba(245,230,200,0.1)]',
                indicator: 'bg-amber-200'
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
                <h1 className="text-3xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-500 to-orange-600 tracking-tight drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                    ⚗️ Prompt Alchemy
                </h1>
                <p className="text-amber-200/70 text-xs md:text-base font-medium">煉金術士的提示詞實驗室</p>
            </div>


            <PromptForm onSuccess={handleSuccess} initialData={reuseData} />

            <div className="w-full border-t border-white/10" />

            {/* 功能快捷列 */}
            <div className="w-full max-w-5xl px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <NavCard
                        label="AI 換臉" emoji="🎭"
                        active={showFaceSwap}
                        onClick={() => setShowFaceSwap(!showFaceSwap)}
                        accent="copper"
                    />
                    <NavCard
                        label="批量匯入" emoji="📥"
                        active={showBatchImport}
                        onClick={() => setShowBatchImport(true)}
                        accent="bronze"
                    />
                    <NavCard
                        label="智能標籤" emoji="🏷️"
                        active={showSmartTag}
                        onClick={() => setShowSmartTag(true)}
                        accent="gold"
                    />
                    <NavCard
                        label="更新日誌" emoji="📋"
                        active={showChangelog}
                        onClick={() => setShowChangelog(true)}
                        accent="parchment"
                    />
                </div>
            </div>

            <PromptGallery
                refreshTrigger={refreshTrigger}
                onReuse={setReuseData}
                onSetAsReference={(image) => {
                    setReuseData({
                        prompt: image.originalPrompt || image.prompt,
                        imageUrl: image.imageUrl,
                    });
                    // Scroll to form automatically
                    setTimeout(() => {
                        document.getElementById('prompt-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                }}
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

            {/* Batch Import Modal */}
            <BatchImportModal isOpen={showBatchImport} onClose={() => setShowBatchImport(false)} />

            {/* Smart Tag Modal */}
            <SmartTagModal
                isOpen={showSmartTag}
                onClose={() => setShowSmartTag(false)}
            />
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


            {/* Face Swap Modal */}
            <FaceSwapModal
                isOpen={showFaceSwap}
                onClose={() => setShowFaceSwap(false)}
            />
        </main>
    );
}
