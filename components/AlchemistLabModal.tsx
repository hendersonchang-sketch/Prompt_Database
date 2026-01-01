
"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Save, Trash2, Beaker, Plus, Edit3, Loader2, Play } from "lucide-react";

interface AlchemistPersona {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    isDefault: boolean;
}

interface AlchemistLabModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPersonaId?: string;
    onSelectPersona: (id: string | null) => void;
}

export default function AlchemistLabModal({ isOpen, onClose, currentPersonaId, onSelectPersona }: AlchemistLabModalProps) {
    const [personas, setPersonas] = useState<AlchemistPersona[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');

    // Edit State
    const [editingPersona, setEditingPersona] = useState<Partial<AlchemistPersona>>({
        name: "",
        description: "",
        systemPrompt: ""
    });
    const [isSaving, setIsSaving] = useState(false);

    // Test Kitchen State
    const [testPrompt, setTestPrompt] = useState("A cute cat in a cyberpunk city");
    const [testResult, setTestResult] = useState("");
    const [isTesting, setIsTesting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchPersonas();
        }
    }, [isOpen]);

    const fetchPersonas = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/personas');
            if (res.ok) {
                const data = await res.json();
                setPersonas(data);
            }
        } catch (e) {
            console.error("Failed to fetch personas", e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setEditingPersona({
            name: "New Persona",
            description: "",
            systemPrompt: "You are an expert AI prompt engineer. Rewrite the user's prompt to be more detailed and artistic."
        });
        setViewMode('edit');
        setTestResult("");
    };

    const handleEdit = (persona: AlchemistPersona) => {
        setEditingPersona({ ...persona });
        setViewMode('edit');
        setTestResult("");
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const method = editingPersona.id ? 'PATCH' : 'POST';
            const url = editingPersona.id ? `/api/personas/${editingPersona.id}` : '/api/personas';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingPersona)
            });

            if (res.ok) {
                await fetchPersonas();
                setViewMode('list');
            } else {
                alert("儲存失敗");
            }
        } catch (e) {
            console.error(e);
            alert("儲存錯誤");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("確定要刪除此人格嗎？")) return;
        try {
            await fetch(`/api/personas/${id}`, { method: 'DELETE' });
            fetchPersonas();
        } catch (e) {
            console.error(e);
        }
    };

    const handleTestRun = async () => {
        if (!editingPersona.systemPrompt) {
            alert("請先輸入 System Prompt！");
            return;
        }

        const apiKey = localStorage.getItem('geminiApiKey');
        if (!apiKey) {
            setTestResult("❌ 錯誤：找不到 API Key。請先在主畫面的「API 設定」中輸入您的 Gemini API Key。");
            return;
        }

        setIsTesting(true);
        setTestResult("正在連線 Alchemy 引擎...");

        try {
            const res = await fetch('/api/test-persona', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemPrompt: editingPersona.systemPrompt,
                    userPrompt: testPrompt,
                    apiKey: apiKey // Pass the key explicitly
                })
            });

            const data = await res.json();

            if (data.error) {
                setTestResult(`❌ API 錯誤: ${data.error}`);
            } else if (data.enhancedPrompt) {
                setTestResult(data.enhancedPrompt);
            } else {
                setTestResult("❌ 錯誤: API 未返回有效內容");
            }
        } catch (e: any) {
            setTestResult(`❌ 連線失敗: ${e.message}`);
            console.error(e);
        } finally {
            setIsTesting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-[#0B0F17] border border-white/10 rounded-3xl w-full max-w-5xl h-[85vh] flex overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Sidebar List */}
                <div className={`w-full md:w-1/3 border-r border-white/5 flex flex-col ${viewMode === 'edit' ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-6 border-b border-white/5 flex flex-col gap-4 bg-black/20">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Beaker className="w-5 h-5 text-purple-400" />
                                    煉金術師實驗室
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">打造您的專屬優化人格</p>
                            </div>
                            <button
                                onClick={handleCreateNew}
                                className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white hover:opacity-90 transition-all font-bold shadow-lg shadow-purple-500/20"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Status Bar */}
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${currentPersonaId ? "bg-green-500 animate-pulse" : "bg-gray-600"}`} />
                                <span className="text-xs text-gray-300">
                                    {currentPersonaId ? "人格運作中" : "未啟用 (使用預設)"}
                                </span>
                            </div>
                            {currentPersonaId && (
                                <button
                                    onClick={() => onSelectPersona(null)}
                                    className="text-[10px] px-2 py-1 bg-red-500/20 text-red-300 rounded border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors"
                                >
                                    🛑 停用
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {loading ? (
                            <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>
                        ) : (
                            personas.map(p => {
                                const isActive = currentPersonaId === p.id;
                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => handleEdit(p)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer group relative ${isActive
                                                ? 'bg-green-500/10 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                                                : editingPersona.id === p.id && viewMode === 'edit'
                                                    ? 'bg-purple-500/10 border-purple-500/50'
                                                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <h3 className={`font-bold ${isActive ? "text-green-400" : "text-white"}`}>
                                                {p.name}
                                            </h3>
                                            {isActive && <span className="text-[10px] bg-green-500 text-black font-bold px-2 py-0.5 rounded-full animate-pulse">Running</span>}
                                            {!isActive && p.isDefault && <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">Default</span>}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.description || "無描述"}</p>

                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!isActive && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onSelectPersona(p.id); onClose(); }}
                                                    className="p-1.5 bg-green-500/20 text-green-400 rounded-md hover:bg-green-500 hover:text-white"
                                                    title="使用此人格"
                                                >
                                                    <Play className="w-3 h-3" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                                                className="p-1.5 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500 hover:text-white"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Main Editor Area */}
                <div className={`w-full md:w-2/3 flex flex-col bg-[#0F1218] ${viewMode === 'list' ? 'hidden md:flex' : 'flex'}`}>
                    {viewMode === 'edit' ? (
                        <>
                            {/* Editor Header */}
                            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setViewMode('list')} className="md:hidden text-gray-400 hover:text-white">Back</button>
                                    <input
                                        value={editingPersona.name}
                                        onChange={e => setEditingPersona({ ...editingPersona, name: e.target.value })}
                                        placeholder="Persona Name"
                                        className="bg-transparent text-xl font-bold text-white focus:outline-none placeholder:text-gray-600 w-full"
                                    />
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save
                                </button>
                            </div>

                            {/* Editor Body */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                                {/* Description */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Description</label>
                                    <input
                                        value={editingPersona.description || ""}
                                        onChange={e => setEditingPersona({ ...editingPersona, description: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 focus:border-purple-500/50 focus:outline-none transition-colors"
                                        placeholder="Brief description of this persona's style..."
                                    />
                                </div>

                                {/* System Prompt */}
                                <div className="space-y-2 flex-1 flex flex-col min-h-[300px]">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest text-purple-400">System Instruction (核心大腦)</label>
                                        <span className="text-[10px] text-gray-600">設定 AI 的身分與風格</span>
                                    </div>

                                    {/* Quick Templates */}
                                    <div className="flex gap-2 pb-2 overflow-x-auto custom-scrollbar">
                                        {[
                                            {
                                                label: "📸 攝影大師",
                                                prompt: "You are a world-class photographer. Enhance prompts with '8k resolution', 'photorealistic', 'cinematic lighting', 'depth of field'. Focus on composition and lens details (e.g. 85mm f/1.8)."
                                            },
                                            {
                                                label: "🎌 吉卜力風",
                                                prompt: "You are a master animator from Studio Ghibli. Rewrite prompts to feature 'hand-drawn animation style', 'vibrant cel shading', 'luscious green landscapes', 'whimsical atmosphere', by Hayao Miyazaki."
                                            },
                                            {
                                                label: "🦾 Cyberpunk",
                                                prompt: "You are a sci-fi concept artist. Infuse prompts with 'neon lights', 'high-tech low-life aesthetic', 'chrome textures', 'rain-slicked streets', 'Blade Runner vibes', 'futuristic details'."
                                            },
                                            {
                                                label: "😱 恐怖大師",
                                                prompt: "You are a horror movie director. Make prompts 'unsettling', 'dark atmosphere', 'foggy', 'lovecraftian', 'subtle horror elements', 'dim lighting', 'psychological thriller vibe'."
                                            }
                                        ].map(t => (
                                            <button
                                                key={t.label}
                                                onClick={() => setEditingPersona(prev => ({ ...prev, systemPrompt: t.prompt }))}
                                                className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-gray-300 hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-500/50 transition-all whitespace-nowrap"
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>

                                    <textarea
                                        value={editingPersona.systemPrompt || ""}
                                        onChange={e => setEditingPersona({ ...editingPersona, systemPrompt: e.target.value })}
                                        className="flex-1 w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-mono text-gray-300 focus:border-purple-500/50 focus:outline-none transition-colors leading-relaxed resize-none"
                                        placeholder="例如：你是一位印象派畫家，請用莫內的筆觸來改寫所有用戶的描述..."
                                    />
                                </div>

                                {/* Test Kitchen */}
                                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="w-4 h-4 text-amber-400" />
                                        <h3 className="text-sm font-bold text-white">Test Kitchen (測試廚房)</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            value={testPrompt}
                                            onChange={e => setTestPrompt(e.target.value)}
                                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none"
                                        />
                                        <button
                                            onClick={handleTestRun}
                                            disabled={isTesting}
                                            className="px-4 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold hover:bg-amber-600/40 transition-colors"
                                        >
                                            {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : "TEST"}
                                        </button>
                                    </div>
                                    {testResult && (
                                        <div className="p-3 bg-black/50 rounded-lg border border-white/5">
                                            <p className="text-xs text-gray-400 font-mono italic leading-relaxed">{testResult}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-600 p-8 text-center">
                            <Beaker className="w-16 h-16 mb-4 opacity-20" />
                            <h3 className="text-xl font-bold text-gray-500">Select a Persona to Edit</h3>
                            <p className="text-sm mt-2">Or create a new one to start experimenting.</p>
                        </div>
                    )}
                </div>

                {/* Close Button Mobile */}
                <button onClick={onClose} className="absolute top-4 right-4 md:hidden p-2 bg-black/50 text-white rounded-full z-10"><X className="w-5 h-5" /></button>
            </div>
        </div>
    );
}
