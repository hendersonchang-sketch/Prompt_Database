import React, { useState, useEffect } from 'react';

interface Snippet {
    id: string;
    category: string;
    content: string;
    label: string;
}

interface PromptLabModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUsePrompt: (prompt: string) => void;
}

const CATEGORIES = [
    { id: 'subject', label: '主體', color: 'bg-pink-500', border: 'border-pink-500' },
    { id: 'style', label: '風格', color: 'bg-purple-500', border: 'border-purple-500' },
    { id: 'lighting', label: '光影', color: 'bg-amber-500', border: 'border-amber-500' },
    { id: 'camera', label: '相機', color: 'bg-cyan-500', border: 'border-cyan-500' },
    { id: 'quality', label: '品質', color: 'bg-emerald-500', border: 'border-emerald-500' },
];

export default function PromptLabModal({ isOpen, onClose, onUsePrompt }: PromptLabModalProps) {
    const [snippets, setSnippets] = useState<Record<string, Snippet[]>>({});
    const [selectedSnippets, setSelectedSnippets] = useState<Snippet[]>([]);
    const [customInput, setCustomInput] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newSnippet, setNewSnippet] = useState({ category: 'style', label: '', content: '' });
    const [showHelp, setShowHelp] = useState(false);

    // Fetch snippets
    useEffect(() => {
        if (isOpen) {
            fetchSnippets();
        }
    }, [isOpen]);

    const fetchSnippets = async () => {
        try {
            const res = await fetch('/api/prompt-lab/snippets');
            const data = await res.json();
            setSnippets(data);
        } catch (err) {
            console.error('Failed to load snippets');
        }
    };

    const handleAddSnippet = async () => {
        if (!newSnippet.label || !newSnippet.content) return;
        try {
            const res = await fetch('/api/prompt-lab/snippets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSnippet)
            });
            if (res.ok) {
                setIsAdding(false);
                setNewSnippet({ ...newSnippet, label: '', content: '' });
                fetchSnippets();
            }
        } catch (err) {
            alert('新增失敗');
        }
    };

    const handleDeleteSnippet = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('確定刪除此片段？')) return;
        try {
            await fetch(`/api/prompt-lab/snippets?id=${id}`, { method: 'DELETE' });
            fetchSnippets();
        } catch (err) {
            alert('刪除失敗');
        }
    };

    const fullPrompt = selectedSnippets.map(s => s.content).join(', ') + (customInput ? (selectedSnippets.length > 0 ? ', ' : '') + customInput : '');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gray-900/50 relative">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🧪</span>
                        <div>
                            <h2 className="text-xl font-bold text-white">Prompt 實驗室</h2>
                            <p className="text-xs text-gray-400">積木式構建您的完美提示詞</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowHelp(!showHelp)}
                            className={`p-2 rounded-full transition-colors ${showHelp ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                            title="使用說明"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">×</button>
                    </div>

                    {/* Help Overlay */}
                    {showHelp && (
                        <div className="absolute top-16 right-4 w-80 bg-gray-800 border border-white/20 rounded-xl shadow-2xl p-5 z-50 text-sm animate-in fade-in slide-in-from-top-2 backdrop-blur-xl">
                            <h3 className="font-bold text-white mb-3 text-base flex items-center gap-2">
                                📚 快速指南
                            </h3>
                            <ul className="space-y-3 text-gray-300">
                                <li className="flex gap-2">
                                    <span className="bg-indigo-500/20 text-indigo-300 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                                    <span><strong>挑選積木</strong>：點擊左側分類標籤 (如 <span className="text-pink-400">Cyberpunk</span>) 加入組合。</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="bg-indigo-500/20 text-indigo-300 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                                    <span><strong>組合編輯</strong>：右側會顯示已選標籤，可拖曳或點擊 × 移除。</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="bg-indigo-500/20 text-indigo-300 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                                    <span><strong>自定義</strong>：用下方輸入框補充細節 (如 "running in rain")。</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="bg-indigo-500/20 text-indigo-300 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
                                    <span><strong>擴充與應用</strong>：左上角 <strong className="text-indigo-400">+</strong> 可儲存常用詞彙；右下角皆可一鍵應用。</span>
                                </li>
                            </ul>
                            <div className="mt-4 pt-3 border-t border-white/10 text-xs text-gray-500 text-center">
                                再次點擊 ? 按鈕可關閉此說明
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 flex overflow-hidden">

                    {/* Left: Snippet Library */}
                    <div className="w-1/3 border-r border-white/10 flex flex-col bg-gray-900/30">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-gray-300">語句庫</h3>
                            <button
                                onClick={() => setIsAdding(!isAdding)}
                                className="text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
                            >
                                + 新增片段
                            </button>
                        </div>

                        {/* Add Snippet Form */}
                        {isAdding && (
                            <div className="p-4 bg-indigo-900/20 border-b border-indigo-500/30 space-y-2">
                                <div className="flex gap-2">
                                    <select
                                        value={newSnippet.category}
                                        onChange={e => setNewSnippet({ ...newSnippet, category: e.target.value })}
                                        className="bg-gray-800 text-sm rounded border border-gray-700 px-2 py-1 text-white"
                                    >
                                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                    <input
                                        placeholder="標籤 (如: 8K)"
                                        className="flex-1 bg-gray-800 text-sm rounded border border-gray-700 px-2 py-1 text-white"
                                        value={newSnippet.label}
                                        onChange={e => setNewSnippet({ ...newSnippet, label: e.target.value })}
                                    />
                                </div>
                                <textarea
                                    placeholder="內容 (如: 8k resolution, best quality)"
                                    className="w-full bg-gray-800 text-sm rounded border border-gray-700 px-2 py-1 text-white h-16"
                                    value={newSnippet.content}
                                    onChange={e => setNewSnippet({ ...newSnippet, content: e.target.value })}
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setIsAdding(false)} className="text-xs text-gray-400 hover:text-white">取消</button>
                                    <button onClick={handleAddSnippet} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded">儲存</button>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {CATEGORIES.map(cat => (
                                <div key={cat.id}>
                                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${cat.color} bg-clip-text text-transparent`}>{cat.label}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {(snippets[cat.id] || []).map(snippet => (
                                            <div
                                                key={snippet.id}
                                                onClick={() => setSelectedSnippets([...selectedSnippets, snippet])}
                                                className={`group relative px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/30 cursor-pointer transition-all text-sm text-gray-300 hover:text-white`}
                                            >
                                                {snippet.label}
                                                <button
                                                    onClick={(e) => handleDeleteSnippet(snippet.id, e)}
                                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        {(!snippets[cat.id] || snippets[cat.id].length === 0) && (
                                            <div className="text-xs text-gray-600 italic">尚無片段</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Builder Area */}
                    <div className="flex-1 flex flex-col bg-black/20">
                        {/* Workbench */}
                        <div className="flex-1 p-8 overflow-y-auto">
                            <div className="border-2 border-dashed border-white/10 rounded-xl min-h-[200px] p-6 flex flex-wrap content-start gap-3 transition-colors hover:border-white/20">
                                {selectedSnippets.length === 0 && !customInput && (
                                    <div className="w-full h-32 flex items-center justify-center text-gray-500 select-none">
                                        點擊左側片段或在下方輸入以開始構建...
                                    </div>
                                )}

                                {selectedSnippets.map((snippet, idx) => {
                                    const cat = CATEGORIES.find(c => c.id === snippet.category) || CATEGORIES[0];
                                    return (
                                        <div
                                            key={`${snippet.id}-${idx}`}
                                            className={`flex items-center gap-2 pl-3 pr-2 py-2 rounded-lg bg-gray-800 border ${cat.border} border-opacity-30 shadow-lg animate-in fade-in zoom-in-95 duration-200`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${cat.color}`}></div>
                                            <span className="text-sm font-medium text-white">{snippet.content}</span>
                                            <button
                                                onClick={() => {
                                                    const newSelected = [...selectedSnippets];
                                                    newSelected.splice(idx, 1);
                                                    setSelectedSnippets(newSelected);
                                                }}
                                                className="ml-1 p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Result Area */}
                        <div className="p-6 bg-gray-900 border-t border-white/10">
                            <div className="mb-4">
                                <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">自定義輸入 (補充細節)</label>
                                <input
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="例如: a beautiful girl reading a book..."
                                    value={customInput}
                                    onChange={e => setCustomInput(e.target.value)}
                                />
                            </div>

                            <div className="bg-black rounded-xl p-4 border border-white/10 relative group">
                                <label className="absolute -top-3 left-4 text-xs bg-gray-900 px-2 text-indigo-400 font-bold">最終 Prompt</label>
                                <p className="text-gray-300 font-mono text-sm leading-relaxed min-h-[3em]">
                                    {fullPrompt || <span className="text-gray-600 italic">等待輸入...</span>}
                                </p>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(fullPrompt);
                                        alert('已複製到剪貼簿！');
                                    }}
                                    className="absolute top-2 right-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    📋
                                </button>
                            </div>

                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={() => {
                                        setSelectedSnippets([]);
                                        setCustomInput('');
                                    }}
                                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                                >
                                    清空
                                </button>
                                <button
                                    onClick={() => onUsePrompt(fullPrompt)}
                                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                                >
                                    ✨ 使用此 Prompt
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
