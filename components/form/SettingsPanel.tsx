import { PROVIDERS } from "@/lib/prompt-data";

interface SettingsPanelProps {
    formData: any;
    showApiSettings: boolean;
    setShowApiSettings: (show: boolean) => void;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleReset: () => void;
}

export default function SettingsPanel({
    formData,
    showApiSettings,
    setShowApiSettings,
    handleChange,
    handleReset
}: SettingsPanelProps) {
    return (
        <>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">AI 服務商</label>
                    <select
                        name="provider"
                        value={formData.provider}
                        onChange={handleChange}
                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                        {PROVIDERS.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.label}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type="button"
                    onClick={() => setShowApiSettings(!showApiSettings)}
                    className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                    {showApiSettings ? "隐藏設定" : "API 設定"}
                    <svg className={`w-4 h-4 transition-transform ${showApiSettings ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 border border-red-500/30 px-2 py-1 rounded bg-red-500/10"
                    title="重置所有設定為預設值"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    重置
                </button>
            </div>

            {showApiSettings && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black/20 rounded-xl border border-white/5 animate-in slide-in-from-top-2 fade-in duration-200">
                    {formData.provider === "sd" && (
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400">API 網址 (URL)</label>
                            <input
                                type="text"
                                name="apiUrl"
                                value={formData.apiUrl}
                                onChange={handleChange}
                                placeholder="e.g., http://127.0.0.1:7860"
                                className="w-full bg-black/40 border-white/10 rounded-lg p-2 text-sm text-white"
                            />
                        </div>
                    )}
                    <div className="space-y-1">
                        <label className="text-xs text-gray-400">API 金鑰 (Key)</label>
                        <input
                            type="password"
                            name="apiKey"
                            value={formData.apiKey}
                            onChange={handleChange}
                            placeholder={formData.provider === "gemini" ? "Required for Gemini" : "Optional"}
                            className="w-full bg-black/40 border-white/10 rounded-lg p-2 text-sm text-white"
                        />
                    </div>
                    {formData.provider === "gemini" && (
                        <div className="col-span-full text-xs text-blue-300 bg-blue-500/10 p-2 rounded">
                            提示：使用 Google Imagen 3 模型生成真實圖片。請確保您的 API Key 具有權限。
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
