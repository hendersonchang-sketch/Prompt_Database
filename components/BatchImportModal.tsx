"use client";

import { useState, useRef } from "react";

interface BatchImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface FileStatus {
    file: File;
    status: 'pending' | 'processing' | 'success' | 'error';
    error?: string;
}

export default function BatchImportModal({ isOpen, onClose }: BatchImportModalProps) {
    const [files, setFiles] = useState<FileStatus[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(f => ({
                file: f,
                status: 'pending' as const
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files) {
            const newFiles = Array.from(e.dataTransfer.files)
                .filter(f => f.type.startsWith('image/'))
                .map(f => ({
                    file: f,
                    status: 'pending' as const
                }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const startImport = async () => {
        if (files.length === 0) return;
        setIsUploading(true);

        const apiKey = localStorage.getItem('geminiApiKey');
        if (!apiKey) {
            alert("請先設定 Gemini API Key");
            setIsUploading(false);
            return;
        }

        // We send all files at once? Or chunks?
        // The API I wrote handles array of files. Let's send all at once for simplicity, 
        // but for progress tracking, it's better if the API reported progress or we sent one by one.
        // My API design `const files = formData.getAll('files')` implies one request.
        // But UI progress is nice.
        // Let's modify strategy: Request per file? Or Just wait.
        // Given I implemented "Process files sequentially" in loop in API, one request is simplest but timeouts might occur for many files.
        // Improved Strategy: Send 1 by 1 or batches of 3 from Frontend.
        // Let's do batches of 1 (Parallel execution controlled by frontend) for granular progress.

        // Wait, the API `formData.getAll('files')` is already written to accept multiple.
        // If I change to 1 by 1, I can use the same API but just send 1 file.
        // Let's do that for better UX.

        let completed = 0;

        // Process max 2 at a time
        const processFile = async (fileStatus: FileStatus, index: number) => {
            setFiles(prev => {
                const copy = [...prev];
                copy[index].status = 'processing';
                return copy;
            });

            const formData = new FormData();
            formData.append('files', fileStatus.file);
            formData.append('apiKey', apiKey);

            try {
                const res = await fetch('/api/batch-import', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();

                if (data.results && data.results[0].status === 'success') {
                    setFiles(prev => {
                        const copy = [...prev];
                        copy[index].status = 'success';
                        return copy;
                    });
                } else {
                    throw new Error(data.results?.[0]?.error || "Import failed");
                }

            } catch (err: any) {
                setFiles(prev => {
                    const copy = [...prev];
                    copy[index].status = 'error';
                    copy[index].error = err.message;
                    return copy;
                });
            } finally {
                completed++;
                setProgress(Math.round((completed / files.length) * 100));
            }
        };

        // Execution Queue
        const pendingFiles = files.map((f, i) => ({ ...f, originalIndex: i })).filter(f => f.status === 'pending');

        // Simple sequential for safety (Gemini Rate Limits)
        for (const f of pendingFiles) {
            await processFile(f, f.originalIndex);
        }

        setIsUploading(false);
        // Alert completion?
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-gray-900 border border-white/20 rounded-2xl p-6 flex flex-col h-[80vh] relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>

                <h2 className="text-2xl font-bold text-white mb-2">📥 批量匯入 & 自動標註</h2>
                <p className="text-gray-400 text-sm mb-6">支援拖曳上傳，AI 會自動為每張圖生成 Prompt 並建檔。</p>

                {/* Drop Zone */}
                <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-gray-700 hover:border-green-500 rounded-xl p-8 text-center transition-colors cursor-pointer bg-gray-800/50 mb-4"
                >
                    <input type="file" multiple onChange={handleFileSelect} accept="image/*" className="hidden" id="file-upload" />
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="text-4xl mb-2">📂</div>
                        <p className="text-gray-300">點擊選擇檔案 或 拖曳至此</p>
                    </label>
                </div>

                {/* Status Bar */}
                {isUploading && (
                    <div className="mb-4">
                        <div className="flex justify-between text-xs text-white mb-1">
                            <span>處理中...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}

                {/* File List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {files.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                            {/* Preview Thumbnail (if possible) */}
                            <div className="w-10 h-10 bg-black/50 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {item.status === 'success' && <span className="text-green-500">✔</span>}
                                {item.status === 'error' && <span className="text-red-500">✘</span>}
                                {item.status === 'processing' && <span className="animate-spin">⏳</span>}
                                {item.status === 'pending' && <span className="text-gray-500">...</span>}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-white truncate">{item.file.name}</div>
                                <div className="text-xs text-gray-500">
                                    {(item.file.size / 1024).toFixed(1)} KB
                                    {item.error && <span className="text-red-400 ml-2">- {item.error}</span>}
                                </div>
                            </div>

                            {item.status === 'pending' && !isUploading && (
                                <button onClick={() => removeFile(idx)} className="text-gray-500 hover:text-red-400 px-2">
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                    {files.length === 0 && (
                        <div className="text-center text-gray-600 py-10 italic">尚未選擇檔案</div>
                    )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                        onClick={onClose}
                        disabled={isUploading}
                        className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50"
                    >
                        關閉
                    </button>
                    <button
                        onClick={startImport}
                        disabled={isUploading || files.length === 0}
                        className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUploading ? "匯入中..." : `開始匯入 (${files.length})`}
                    </button>
                </div>

            </div>
        </div>
    );
}
