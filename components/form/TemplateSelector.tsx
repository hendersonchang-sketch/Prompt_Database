import { useState, useEffect } from "react";
import { TEMPLATE_CATEGORIES, TemplateCategory, PromptTemplate } from "@/lib/prompt-data";
import { Loader2 } from "lucide-react";

interface TemplateSelectorProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    activeCategory: TemplateCategory;
    setActiveCategory: (cat: TemplateCategory) => void;
    onSelect: (prompt: string, name: string) => void;
    usageStats: Record<string, number>;
}

export default function TemplateSelector({
    isOpen,
    setIsOpen,
    activeCategory,
    setActiveCategory,
    onSelect,
    usageStats
}: TemplateSelectorProps) {
    const [templates, setTemplates] = useState<PromptTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen && templates.length === 0) {
            setLoading(true);
            fetch('/api/templates')
                .then(res => {
                    if (!res.ok) throw new Error('Failed to load templates');
                    return res.json();
                })
                .then(data => {
                    // Start with empty array to clear previous data if any (though unlikely here)
                    setTemplates(data);
                    // Ensure active category is valid or default to first
                    if (data.length > 0 && !TEMPLATE_CATEGORIES.includes(activeCategory)) {
                        // Keep default or logic
                    }
                })
                .catch(err => setError(err.message))
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    return (
        <div className="border border-white/10 rounded-xl overflow-hidden bg-black/20">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="text-sm font-medium text-purple-200">📚 選擇風格模板</span>
                    <span className="text-xs text-gray-500">
                        ({templates.length > 0 ? templates.length : '...'} 款)
                    </span>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="p-4 pt-0 space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="flex flex-wrap gap-2">
                        {TEMPLATE_CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setActiveCategory(cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeCategory === cat
                                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-400 py-4 text-xs">
                            {error}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
                            {templates.filter(t => t.category === activeCategory).map((template, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => onSelect(template.prompt, template.name)}
                                    className="group p-3 bg-white/5 hover:bg-purple-500/20 border border-white/5 hover:border-purple-500/50 rounded-lg text-left transition-all relative"
                                >
                                    {usageStats[template.name] && (
                                        <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[9px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                            {usageStats[template.name]}
                                        </span>
                                    )}
                                    <div className="text-sm font-medium text-white group-hover:text-purple-200 truncate">
                                        {template.name}
                                    </div>
                                    <div className="text-[10px] text-gray-500 group-hover:text-purple-300 truncate mt-0.5">
                                        {template.desc}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="text-[10px] text-gray-500 text-center pt-1">
                        💡 點擊模板後，請將 <span className="text-amber-400 font-mono">[主體]</span> 替換成您想要的內容
                    </div>
                </div>
            )}
        </div>
    );
}
