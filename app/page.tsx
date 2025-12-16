"use client";

import { useState } from "react";
import PromptForm from "@/components/PromptForm";
import PromptGallery from "@/components/PromptGallery";
import ServerStatus from "@/components/ServerStatus";

export default function Home() {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [reuseData, setReuseData] = useState<any>(null);

    const handleSuccess = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    return (
        <main className="min-h-screen flex flex-col items-center py-8 md:py-20 gap-8 md:gap-16 px-4">
            <div className="text-center space-y-2 md:space-y-4">
                <h1 className="text-3xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-600">
                    Prompt Database
                </h1>
                <p className="text-gray-400 text-sm md:text-lg">打造您的專屬提示詞庫</p>
            </div>

            <PromptForm onSuccess={handleSuccess} initialData={reuseData} />

            <div className="w-full border-t border-white/10" />

            <PromptGallery refreshTrigger={refreshTrigger} onReuse={setReuseData} />

            {/* Server Status Indicator */}
            <ServerStatus />
        </main>
    );
}
