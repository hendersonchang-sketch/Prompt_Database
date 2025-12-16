"use client";

import { useState } from "react";
import PromptForm from "@/components/PromptForm";
import PromptGallery from "@/components/PromptGallery";

export default function Home() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [reuseData, setReuseData] = useState<any>(null);

    const handleSuccess = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    return (
        <main className="min-h-screen flex flex-col items-center py-20 gap-16">
            <div className="text-center space-y-4">
                <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-600 animate-pulse">
                    Graphic Prompt Database
                </h1>
                <p className="text-gray-400 text-lg">打造您的專屬提示詞庫，生成無限創意。</p>
            </div>

            <PromptForm onSuccess={handleSuccess} initialData={reuseData} />

            <div className="w-full border-t border-white/10" />

            <PromptGallery refreshTrigger={refreshTrigger} onReuse={setReuseData} />
        </main>
    );
}
