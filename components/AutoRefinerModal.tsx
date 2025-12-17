"use client";

import { useState, useEffect, useRef } from "react";

interface AutoRefinerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface AgentStep {
    round: number;
    prompt: string;
    imageUrl?: string;
    score?: number;
    critique?: string;
    status: 'pending' | 'generating' | 'evaluating' | 'refining' | 'done' | 'stopped';
}

export default function AutoRefinerModal({ isOpen, onClose }: AutoRefinerModalProps) {
    const [startPrompt, setStartPrompt] = useState("");
    const [targetScore, setTargetScore] = useState(85);
    const [isRunning, setIsRunning] = useState(false);
    const [history, setHistory] = useState<AgentStep[]>([]);
    const [logs, setLogs] = useState<string[]>([]);

    // Stop the loop
    const stopRef = useRef(false);

    const log = (msg: string) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] ${msg}`, ...prev]);
    };

    const handleStart = async () => {
        if (!startPrompt.trim()) return;
        setIsRunning(true);
        setHistory([]);
        setLogs([]);
        stopRef.current = false;

        let currentPrompt = startPrompt;
        let round = 1;
        const MAX_ROUNDS = 5;

        while (round <= MAX_ROUNDS && !stopRef.current) {
            log(`--- Round ${round} Start ---`);

            // Create History Entry
            const stepId = round;
            setHistory(prev => [...prev, {
                round: stepId,
                prompt: currentPrompt,
                status: 'generating'
            }]);

            try {
                // 1. Generate Image
                log("Generating image...");
                const genRes = await fetch('/api/prompts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: currentPrompt,
                        // Defaults
                        width: 1024, height: 1024, steps: 30, params: { cfgScale: 7 }
                    })
                });
                const genData = await genRes.json();
                if (genData.error) throw new Error(genData.error);

                const imageUrl = genData.imageUrl;
                updateHistory(stepId, { imageUrl, status: 'evaluating' });

                // 2. Evaluate Image
                log("Evaluating image...");
                const evalRes = await fetch('/api/comprehensive-eval', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        imageBase64: imageUrl, // Wait, imageUrl is a path '/uploads/...'. API expects Base64.
                        // We need to fetch the blob? Or does api/comprehensive-eval handle URLs?
                        // Checked route.ts: It expects "imageBase64".
                        // So we need to fetch the image we just created.
                        apiKey: localStorage.getItem('geminiApiKey')
                    })
                });

                // Helper to get Base64 from URL
                // Since it's a local file '/uploads/...'
                const imageBlob = await fetch(imageUrl).then(r => r.blob());
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(imageBlob);
                });

                // Do the actual call with Base64
                const evalResWithData = await fetch('/api/comprehensive-eval', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        imageBase64: base64,
                        apiKey: localStorage.getItem('geminiApiKey')
                    })
                });

                const evalData = await evalResWithData.json();
                if (evalData.error) throw new Error(evalData.error);

                const score = evalData.overallScore?.total || 0;
                log(`Score: ${score}`);
                updateHistory(stepId, { score, status: 'refining' });

                // 3. Check Target
                if (score >= targetScore) {
                    log(`Target score reached! (${score} >= ${targetScore})`);
                    updateHistory(stepId, { status: 'done' });
                    break;
                }

                if (round === MAX_ROUNDS) {
                    log("Max rounds reached.");
                    updateHistory(stepId, { status: 'done' });
                    break;
                }

                // 4. Refine Prompt
                log("Refining prompt...");
                const refineRes = await fetch('/api/refine-prompt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        originalPrompt: currentPrompt,
                        score: score,
                        critique: evalData.improvementRoadmap, // Pass the array
                        apiKey: localStorage.getItem('geminiApiKey')
                    })
                });
                const refineData = await refineRes.json();
                if (refineData.error) throw new Error(refineData.error);

                currentPrompt = refineData.newPrompt;
                log("Prompt refined.");
                updateHistory(stepId, { status: 'done' }); // Current step done, next one starts

                round++;

            } catch (err: any) {
                log(`Error: ${err.message}`);
                console.error(err);
                updateHistory(stepId, { status: 'stopped' });
                stopRef.current = true;
                break;
            }
        }

        setIsRunning(false);
    };

    const updateHistory = (round: number, updates: Partial<AgentStep>) => {
        setHistory(prev => prev.map(item =>
            item.round === round ? { ...item, ...updates } : item
        ));
    };

    const handleStop = () => {
        stopRef.current = true;
        setIsRunning(false);
        log("Agent stopped by user.");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-6xl h-[90vh] flex gap-4">

                {/* Left: Controls & Logs */}
                <div className="w-1/3 bg-gray-900 border border-white/10 rounded-2xl p-6 flex flex-col">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 mb-4 flex items-center gap-2">
                        🤖 Auto-Refiner Agent
                    </h2>

                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Initial Idea</label>
                            <textarea
                                value={startPrompt}
                                onChange={e => setStartPrompt(e.target.value)}
                                placeholder="Describe what you want (e.g. A cyberpunk warrior)"
                                disabled={isRunning}
                                className="w-full h-24 bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-cyan-500 resize-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Target Score (1-100)</label>
                            <input
                                type="number"
                                value={targetScore}
                                onChange={e => setTargetScore(parseInt(e.target.value))}
                                disabled={isRunning}
                                className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white"
                            />
                        </div>

                        {!isRunning ? (
                            <button
                                onClick={handleStart}
                                disabled={!startPrompt.trim()}
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                            >
                                Start Agent Loop
                            </button>
                        ) : (
                            <button
                                onClick={handleStop}
                                className="w-full py-3 bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 font-bold rounded-xl transition-all"
                            >
                                Stop Agent
                            </button>
                        )}
                    </div>

                    <div className="flex-1 bg-black/50 rounded-xl p-3 overflow-y-auto font-mono text-xs text-green-400">
                        {logs.map((l, i) => (
                            <div key={i} className="mb-1 border-b border-white/5 pb-1 last:border-0">{l}</div>
                        ))}
                    </div>

                    <button onClick={onClose} className="mt-4 text-gray-500 hover:text-white text-sm">Close Window</button>
                </div>

                {/* Right: Visualization */}
                <div className="flex-1 bg-gray-900 border border-white/10 rounded-2xl p-6 overflow-y-auto">
                    <div className="space-y-8">
                        {history.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600">
                                <div className="text-6xl mb-4">🧬</div>
                                <p>等待啟動...</p>
                            </div>
                        )}

                        {history.map((step) => (
                            <div key={step.round} className="animate-fade-in">
                                <div className="flex items-center gap-4 mb-2">
                                    <span className="bg-cyan-900/50 text-cyan-200 px-3 py-1 rounded-full text-xs font-bold border border-cyan-500/30">
                                        Round {step.round}
                                    </span>
                                    {step.score !== undefined && (
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${step.score >= targetScore ? 'bg-green-900/50 text-green-300 border-green-500' : 'bg-yellow-900/50 text-yellow-300 border-yellow-500'}`}>
                                            Score: {step.score}
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-500 uppercase tracking-widest">{step.status}</span>
                                </div>

                                <div className="flex gap-4">
                                    {/* Image */}
                                    <div className="w-64 h-64 bg-black/30 rounded-lg flex items-center justify-center border border-white/5 shrink-0 overflow-hidden relative">
                                        {step.imageUrl ? (
                                            <img src={step.imageUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="animate-pulse text-4xl">🖼️</div>
                                        )}
                                        {step.status === 'generating' && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Text Info */}
                                    <div className="flex-1 space-y-2">
                                        <div className="bg-white/5 rounded p-3 border border-white/5">
                                            <p className="text-xs text-gray-400 mb-1">Prompt</p>
                                            <p className="text-sm text-gray-300 line-clamp-4">{step.prompt}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="ml-8 w-0.5 h-8 bg-gradient-to-b from-cyan-500/50 to-transparent my-2"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
