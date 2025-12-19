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


            <PromptForm onSuccess={handleSuccess} initialData={reuseData} />

            <div className="w-full border-t border-white/10" />

            {/* 功能快捷列 */}
            <div className="w-full max-w-5xl px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <NavCard
                        label="AI 換臉" emoji="🎭"
                        active={showFaceSwap}
                        onClick={() => setShowFaceSwap(!showFaceSwap)}
                        accent="violet"
                    />
                    <NavCard
                        label="批量匯入" emoji="📥"
                        active={showBatchImport}
                        onClick={() => setShowBatchImport(true)}
                        accent="green"
                    />
                    <NavCard
                        label="智能標籤" emoji="🏷️"
                        active={showSmartTag}
                        onClick={() => setShowSmartTag(true)}
                        accent="emerald"
                    />
                    <NavCard
                        label="更新日誌" emoji="📋"
                        active={showChangelog}
                        onClick={() => setShowChangelog(true)}
                        accent="gray"
                    />
                </div>
            </div>

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
