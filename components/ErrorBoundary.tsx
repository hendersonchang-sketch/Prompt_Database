"use client";
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6">
                    <div className="max-w-md w-full bg-zinc-900/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
                        <div className="text-5xl">⚠️</div>
                        <div className="space-y-2">
                            <h1 className="text-xl font-bold text-white">發生了一點錯誤</h1>
                            <p className="text-gray-400 text-sm">
                                抱歉，系統目前似乎遇到了一點問題。請嘗試重新整理頁面以還原連線。
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-purple-500/20"
                        >
                            重新整理頁面
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
