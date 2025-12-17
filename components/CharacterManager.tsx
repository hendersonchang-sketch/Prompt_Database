
import React, { useState, useEffect } from 'react';

interface Character {
    id: string;
    name: string;
    description: string | null;
    basePrompt: string;
    seed: number | null;
    avatarUrl: string | null;
}

interface CharacterManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (char: Character) => void;
}

export default function CharacterManager({ isOpen, onClose, onSelect }: CharacterManagerProps) {
    const [characters, setCharacters] = useState<Character[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newChar, setNewChar] = useState<Partial<Character>>({
        name: '',
        description: '',
        basePrompt: '',
        seed: -1,
        avatarUrl: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchCharacters();
        }
    }, [isOpen]);

    const fetchCharacters = async () => {
        try {
            const res = await fetch('/api/characters');
            if (res.ok) {
                const data = await res.json();
                setCharacters(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreate = async () => {
        if (!newChar.name || !newChar.basePrompt) {
            alert('名稱與基礎 Prompt 為必填');
            return;
        }
        try {
            const res = await fetch('/api/characters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newChar)
            });
            if (res.ok) {
                setIsAdding(false);
                setNewChar({ name: '', description: '', basePrompt: '', seed: -1, avatarUrl: '' });
                fetchCharacters();
            }
        } catch (error) {
            alert('建立失敗');
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('確定刪除此角色？')) return;
        await fetch(`/api/characters?id=${id}`, { method: 'DELETE' });
        fetchCharacters();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">👤</span>
                        <h2 className="text-xl font-bold text-white">角色庫 (Character Vault)</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-black/20">

                    {!isAdding && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Add New Card */}
                            <div
                                onClick={() => setIsAdding(true)}
                                className="border-2 border-dashed border-white/10 hover:border-indigo-500/50 rounded-xl p-6 flex flex-col items-center justify-center min-h-[200px] cursor-pointer group transition-all"
                            >
                                <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-indigo-500 flex items-center justify-center text-2xl transition-colors mb-3">
                                    +
                                </div>
                                <span className="text-gray-400 group-hover:text-white font-medium">新增角色</span>
                            </div>

                            {/* Character Cards */}
                            {characters.map(char => (
                                <div
                                    key={char.id}
                                    onClick={() => onSelect(char)}
                                    className="bg-gray-800 border border-white/5 hover:border-indigo-500/50 rounded-xl p-4 cursor-pointer group relative hover:shadow-lg transition-all"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 rounded-lg bg-gray-700 overflow-hidden shrink-0">
                                            {char.avatarUrl ? (
                                                <img src={char.avatarUrl} alt={char.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-white truncate">{char.name}</h3>
                                            <p className="text-xs text-gray-400 line-clamp-2 mt-1">{char.description || "無描述"}</p>

                                            <div className="mt-2 flex gap-2">
                                                {char.seed !== -1 && (
                                                    <span className="text-[10px] bg-green-900/50 text-green-300 px-1.5 py-0.5 rounded border border-green-500/20">
                                                        Seed: {char.seed}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => handleDelete(char.id, e)}
                                        className="absolute top-2 right-2 p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Editor Form */}
                    {isAdding && (
                        <div className="max-w-xl mx-auto bg-gray-800 rounded-xl p-6 border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4">建立新角色</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">角色名稱 *</label>
                                    <input
                                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white"
                                        value={newChar.name}
                                        onChange={e => setNewChar({ ...newChar, name: e.target.value })}
                                        placeholder="例如: Cyberpunk Girl"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">預覽圖 URL (選填)</label>
                                        <input
                                            className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white"
                                            value={newChar.avatarUrl || ''}
                                            onChange={e => setNewChar({ ...newChar, avatarUrl: e.target.value })}
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">固定 Seed (選填, -1 為隨機)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white"
                                            value={newChar.seed || -1}
                                            onChange={e => setNewChar({ ...newChar, seed: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">簡介 (選填)</label>
                                    <input
                                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white"
                                        value={newChar.description || ''}
                                        onChange={e => setNewChar({ ...newChar, description: e.target.value })}
                                        placeholder="簡單描述特徵..."
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">基礎 Prompt (鎖定特徵) *</label>
                                    <textarea
                                        className="w-full h-32 bg-black/30 border border-white/10 rounded px-3 py-2 text-white font-mono text-sm"
                                        value={newChar.basePrompt || ''}
                                        onChange={e => setNewChar({ ...newChar, basePrompt: e.target.value })}
                                        placeholder="red hair, blue eyes, school uniform, detailed face..."
                                    />
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={() => setIsAdding(false)}
                                        className="px-4 py-2 text-gray-400 hover:text-white"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={handleCreate}
                                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold"
                                    >
                                        建立角色
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
