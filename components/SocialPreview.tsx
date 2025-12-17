import React from 'react';

interface SocialPreviewProps {
    imageUrl: string;
    analysis?: {
        socialMedia?: {
            title?: string;
            caption?: string;
            hashtags?: string[];
        }
    } | null;
    isLoading?: boolean;
}

export default function SocialPreview({ imageUrl, analysis, isLoading }: SocialPreviewProps) {
    // Default fallback content if no analysis is available
    const content = {
        username: "prompt_master",
        location: "AI Art Gallery",
        caption: analysis?.socialMedia?.caption || "✨ 探索 AI 藝術的無限可能。\n\n探索 Prompt 的魔法，創造出令人驚嘆的視覺饗宴。這不只是一張圖片，這是想像力的具現化。",
        hashtags: analysis?.socialMedia?.hashtags || ["AIArt", "Midjourney", "StableDiffusion", "DigitalArt", "Creative"],
        likes: Math.floor(Math.random() * 5000) + 1000
    };

    return (
        <div className="bg-white text-black rounded-3xl overflow-hidden max-w-sm mx-auto shadow-2xl border border-gray-200">
            {/* Status Bar Mock */}
            <div className="px-5 py-3 flex justify-between items-center text-xs font-semibold">
                <span>9:41</span>
                <div className="flex gap-1.5">
                    <div className="w-4 h-4 bg-black rounded-full/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-current opacity-100"></div>
                        <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /></svg>
                    </div>
                    <span className="w-4 h-4">📶</span>
                    <span className="w-4 h-4">🔋</span>
                </div>
            </div>

            {/* Header */}
            <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2px]">
                        <div className="w-full h-full rounded-full bg-white p-[2px]">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${imageUrl}`} alt="avatar" className="w-full h-full rounded-full bg-gray-100 object-cover" />
                        </div>
                    </div>
                    <div>
                        <div className="text-xs font-bold leading-tight">{content.username}</div>
                        <div className="text-[10px] text-gray-500 leading-tight">{content.location}</div>
                    </div>
                </div>
                <button className="text-gray-900">•••</button>
            </div>

            {/* Image */}
            <div className="aspect-square bg-gray-100 relative overflow-hidden group">
                {imageUrl ? (
                    <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
                )}

                {isLoading && (
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-white text-sm font-medium animate-pulse">AI 生成文案中...</div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="px-4 py-3">
                <div className="flex justify-between mb-3">
                    <div className="flex gap-4">
                        <button className="hover:text-red-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                        </button>
                        <button className="hover:text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.698 9-8.25s-4.03-8.25-9-8.25S3 7.402 3 11.95c0 4.552 4.03 8.25 9 8.25z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 19.5l-2.25-2.25" />
                            </svg>
                        </button>
                        <button className="hover:text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                        </button>
                    </div>
                    <button className="hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                        </svg>
                    </button>
                </div>

                <div className="text-sm font-semibold mb-2">{content.likes.toLocaleString()} likes</div>

                <div className="text-sm">
                    <span className="font-semibold mr-2">{content.username}</span>
                    <span className="whitespace-pre-line">{content.caption}</span>
                </div>

                <div className="mt-2 text-sm text-blue-900 leading-normal">
                    {content.hashtags.map((tag, i) => (
                        <span key={i} className="mr-1.5 hover:underline cursor-pointer">#{tag.replace(/^#/, '')}</span>
                    ))}
                </div>

                <div className="mt-2 text-[10px] text-gray-400 uppercase tracking-wide">
                    2 HOURS AGO
                </div>
            </div>

            {/* Copy Button */}
            <div className="border-t border-gray-100 p-2 text-center">
                <button
                    onClick={() => {
                        const fullText = `${content.caption}\n\n${content.hashtags.map(t => `#${t.replace(/^#/, '')}`).join(' ')}`;
                        navigator.clipboard.writeText(fullText);
                        alert('已複製貼文文案！');
                    }}
                    className="text-xs text-blue-500 font-semibold py-1 px-3 hover:bg-blue-50 rounded-lg transition-colors"
                >
                    📋 複製完整文案
                </button>
            </div>
        </div>
    );
}
