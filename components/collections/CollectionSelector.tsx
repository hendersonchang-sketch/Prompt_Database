
"use client";

import { useEffect, useState } from "react";
import { Folder, Plus, Check } from "lucide-react";

interface CollectionSelectorProps {
    promptIds: string[];
    onClose: () => void;
}

export default function CollectionSelector({ promptIds, onClose }: CollectionSelectorProps) {
    const [collections, setCollections] = useState<{ id: string, name: string, _count?: { prompts: number } }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/collections')
            .then(res => res.json())
            .then(data => {
                setCollections(data);
                setLoading(false);
            });
    }, []);

    const handleAddToCollection = async (collectionId: string) => {
        try {
            const res = await fetch(`/api/collections/${collectionId}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ promptIds })
            });
            if (res.ok) {
                alert(`已將 ${promptIds.length} 張圖片加入收藏！`);
                onClose();
            }
        } catch (error) {
            alert('加入失敗');
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Folder className="w-5 h-5 text-purple-400" />
                        加入收藏 ({promptIds.length})
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                <div className="p-2 max-h-[300px] overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-4 text-gray-500">載入中...</div>
                    ) : collections.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p className="mb-2">尚無收藏集</p>
                            <span className="text-xs">請先在側邊欄建立</span>
                        </div>
                    ) : (
                        collections.map(col => (
                            <button
                                key={col.id}
                                onClick={() => handleAddToCollection(col.id)}
                                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-gray-400 group-hover:text-purple-400 group-hover:bg-purple-500/10 transition-colors">
                                        <Folder className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-200 group-hover:text-white">{col.name}</div>
                                        <div className="text-xs text-gray-500">{col._count?.prompts || 0} items</div>
                                    </div>
                                </div>
                                <Plus className="w-4 h-4 text-gray-600 group-hover:text-purple-400" />
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
