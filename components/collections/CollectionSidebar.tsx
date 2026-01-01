
"use client";

import { useEffect, useState } from "react";
import { Folder, Plus, Trash2, X, Edit2, LayoutGrid, Settings } from "lucide-react";

interface Collection {
    id: string;
    name: string;
    description?: string;
    coverImage?: string;
    itemCount?: number;
    _count?: { prompts: number };
}

interface CollectionSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    activeCollectionId: string | null;
    onSelectCollection: (id: string | null) => void;
}

export default function CollectionSidebar({ isOpen, onClose, activeCollectionId, onSelectCollection }: CollectionSidebarProps) {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) fetchCollections();
    }, [isOpen]);

    const fetchCollections = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/collections');
            const data = await res.json();
            setCollections(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newCollectionName.trim()) return;
        try {
            const res = await fetch('/api/collections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCollectionName })
            });
            if (res.ok) {
                setNewCollectionName("");
                setIsCreating(false);
                fetchCollections();
            }
        } catch (error) {
            alert('建立失敗');
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('確定要刪除此收藏集嗎？(圖片不會被刪除)')) return;
        try {
            await fetch(`/api/collections/${id}`, { method: 'DELETE' });
            if (activeCollectionId === id) onSelectCollection(null);
            fetchCollections();
        } catch (error) {
            alert('刪除失敗');
        }
    };

    return (
        <div className={`fixed inset-y-0 left-0 z-[60] w-72 bg-gray-900 border-r border-white/10 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-gray-900/50 backdrop-blur">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Folder className="w-5 h-5 text-purple-400" />
                        魔導書庫
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {/* All Items (Default) */}
                    <button
                        onClick={() => onSelectCollection(null)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeCollectionId === null
                            ? "bg-purple-600/20 text-purple-200 border border-purple-500/30"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
                    >
                        <LayoutGrid className="w-5 h-5" />
                        <span className="font-medium">所有圖片</span>
                    </button>

                    <hr className="border-white/10 my-2" />

                    <div className="flex justify-between items-center px-1 mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Collections</span>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="p-1 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded transition-colors"
                            title="新增收藏"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {isCreating && (
                        <div className="mb-2 p-2 bg-white/5 rounded-lg border border-purple-500/30 animate-in fade-in slide-in-from-top-2">
                            <input
                                autoFocus
                                value={newCollectionName}
                                onChange={(e) => setNewCollectionName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                placeholder="輸入名稱..."
                                className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-purple-500 focus:outline-none mb-2"
                            />
                            <div className="flex justify-end gap-2 text-xs">
                                <button onClick={() => setIsCreating(false)} className="px-2 py-1 text-gray-400 hover:text-white">取消</button>
                                <button onClick={handleCreate} className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-500">建立</button>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-4 text-gray-600 text-sm">載入中...</div>
                    ) : (
                        collections.map(col => (
                            <div
                                key={col.id}
                                onClick={() => onSelectCollection(col.id)}
                                className={`group relative w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer border ${activeCollectionId === col.id
                                    ? "bg-white/10 border-purple-500/30 text-white shadow-lg shadow-purple-900/20"
                                    : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"}`}
                            >
                                <div className="relative">
                                    {col.coverImage ? (
                                        <img src={col.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover bg-black/50" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                            <Folder className="w-5 h-5 opacity-50" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="font-medium truncate">{col.name}</div>
                                    <div className="text-xs opacity-50">{col._count?.prompts || 0} items</div>
                                </div>

                                {/* Hover Actions */}
                                <div className={`absolute right-2 flex gap-1 ${activeCollectionId === col.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                    <button
                                        onClick={(e) => handleDelete(e, col.id)}
                                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
