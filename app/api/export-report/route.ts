import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { evaluation, imageInfo, format = 'markdown' } = await request.json();

        if (!evaluation) {
            return NextResponse.json({ error: 'Missing evaluation data' }, { status: 400 });
        }

        const now = new Date();
        const dateStr = now.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const timeStr = now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });

        // Generate Markdown report
        const markdown = generateMarkdownReport(evaluation, imageInfo, dateStr, timeStr);

        if (format === 'markdown') {
            return NextResponse.json({
                content: markdown,
                filename: `evaluation-report-${Date.now()}.md`,
                mimeType: 'text/markdown'
            });
        }

        if (format === 'html') {
            const html = generateHtmlReport(evaluation, imageInfo, dateStr, timeStr);
            return NextResponse.json({
                content: html,
                filename: `evaluation-report-${Date.now()}.html`,
                mimeType: 'text/html'
            });
        }

        return NextResponse.json({ content: markdown });

    } catch (error: any) {
        console.error('Export Report Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function generateHtmlReport(eval_: any, imageInfo: any, date: string, time: string): string {
    const e = eval_;

    return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>全面性圖片評估報告</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Noto Sans TC', sans-serif; }
    </style>
</head>
<body class="bg-gray-50 text-gray-800 p-8 min-h-screen">
    <div class="max-w-5xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-white">
            <div class="flex justify-between items-start">
                <div>
                    <h1 class="text-3xl font-bold mb-2">📊 全面性圖片評估報告</h1>
                    <p class="opacity-80">生成日期: ${date} ${time}</p>
                </div>
                <div class="text-right text-sm opacity-70">
                    ID: ${imageInfo?.id || 'N/A'}
                </div>
            </div>

            <!-- Overall Score Badge -->
            <div class="mt-8 flex items-center justify-between">
                <div class="bg-white/10 backdrop-blur-md rounded-xl p-4 flex items-center gap-4 border border-white/20">
                    <div class="text-center">
                        <div class="text-xs uppercase tracking-wider opacity-70">總分</div>
                        <div class="text-4xl font-bold">${e.overallScore?.total || 0}</div>
                    </div>
                    <div class="h-10 w-px bg-white/20"></div>
                    <div class="text-center">
                        <div class="text-xs uppercase tracking-wider opacity-70">等級</div>
                        <div class="text-4xl font-bold text-yellow-300">${e.overallScore?.grade || 'N/A'}</div>
                    </div>
                </div>
                <div class="text-xl font-medium italic opacity-90 max-w-lg text-right">
                    "${e.overallScore?.summary || ''}"
                </div>
            </div>
        </div>

        <div class="p-8 space-y-8">
            
            <!-- Radar Scores -->
            <section>
                <h2 class="text-xl font-bold flex items-center gap-2 mb-4 text-gray-700">
                    <span class="bg-cyan-100 text-cyan-600 p-1.5 rounded-lg">📈</span> 五維度評分
                </h2>
                <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                    ${[
            { key: 'composition', label: '🎨 構圖', color: 'bg-pink-500' },
            { key: 'color', label: '🌈 色彩', color: 'bg-purple-500' },
            { key: 'creativity', label: '💡 創意', color: 'bg-amber-500' },
            { key: 'technical', label: '⚙️ 技術', color: 'bg-cyan-500' },
            { key: 'emotion', label: '💖 情感', color: 'bg-red-500' },
        ].map(dim => {
            const data = e.radarScores?.[dim.key];
            if (!data) return '';
            return `
                        <div class="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                            <div class="text-3xl font-bold text-gray-800 mb-1">${data.score}/10</div>
                            <div class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">${dim.label}</div>
                            <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
                                <div class="h-2 rounded-full ${dim.color}" style="width: ${data.score * 10}%"></div>
                            </div>
                            <div class="text-xs text-gray-500 leading-tight min-h-[2.5em]">${data.comment || ''}</div>
                        </div>`;
        }).join('')}
                </div>
            </section>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- AI Detection -->
                <section class="bg-purple-50 rounded-2xl p-6 border border-purple-100">
                    <h2 class="text-lg font-bold flex items-center gap-2 mb-4 text-purple-800">
                        <span class="bg-purple-200 text-purple-700 p-1.5 rounded-lg">🤖</span> AI 生成檢測
                    </h2>
                    <div class="flex items-center justify-between mb-4">
                        <span class="font-medium">結果判定</span>
                        <span class="px-3 py-1 rounded-full text-sm font-bold ${e.aiDetection?.isAiGenerated ? 'bg-purple-200 text-purple-800' : 'bg-green-200 text-green-800'}">
                            ${e.aiDetection?.isAiGenerated ? '🤖 AI 生成' : '📷 真人攝影'}
                        </span>
                    </div>
                    <div class="mb-4">
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-gray-600">AI 可信度</span>
                            <span class="font-bold text-purple-700">${Math.round((e.aiDetection?.confidence || 0) * 100)}%</span>
                        </div>
                        <div class="w-full bg-purple-200 rounded-full h-2.5">
                            <div class="bg-purple-600 h-2.5 rounded-full" style="width: ${Math.round((e.aiDetection?.confidence || 0) * 100)}%"></div>
                        </div>
                    </div>
                    <div class="space-y-2">
                         ${(e.aiDetection?.indicators || []).map((i: string) =>
            `<div class="flex items-start gap-2 text-sm text-purple-800 bg-purple-100/50 p-2 rounded">
                                <span class="mt-0.5">•</span><span>${i}</span>
                            </div>`
        ).join('')}
                    </div>
                </section>

                <!-- Copyright Risk -->
                <section class="bg-yellow-50 rounded-2xl p-6 border border-yellow-100">
                    <h2 class="text-lg font-bold flex items-center gap-2 mb-4 text-yellow-800">
                        <span class="bg-yellow-200 text-yellow-700 p-1.5 rounded-lg">⚠️</span> 版權風險評估
                    </h2>
                    <div class="flex items-center justify-between mb-4">
                        <span class="font-medium">風險等級</span>
                        <span class="px-3 py-1 rounded-full text-sm font-bold ${e.copyrightRisk?.riskLevel === 'low' ? 'bg-green-200 text-green-800' :
            e.copyrightRisk?.riskLevel === 'medium' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'
        }">
                            ${getRiskLabel(e.copyrightRisk?.riskLevel)}
                        </span>
                    </div>
                     <div class="space-y-2 mb-4">
                        ${(e.copyrightRisk?.concerns || []).map((c: any) =>
            `<div class="text-sm bg-white p-2 rounded border border-yellow-100">
                                <div class="flex justify-between font-medium text-gray-700">
                                    <span>${c.type}</span>
                                    <span class="text-xs px-1.5 py-0.5 rounded bg-gray-100">${getSeverityLabel(c.severity)}</span>
                                </div>
                                <div class="text-xs text-gray-500 mt-1">${c.description}</div>
                            </div>`
        ).join('') || '<div class="text-sm text-gray-500 italic">無明顯版權風險</div>'}
                    </div>
                    <div class="text-sm bg-yellow-100 p-3 rounded text-yellow-800 border-l-4 border-yellow-400">
                        💡 ${e.copyrightRisk?.recommendation || '無建議'}
                    </div>
                </section>
            </div>

            <!-- Improvement Roadmap -->
            <section>
                <h2 class="text-xl font-bold flex items-center gap-2 mb-6 text-gray-700">
                    <span class="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg">🛠️</span> 優化路線圖
                </h2>
                <div class="space-y-4">
                    ${(e.improvementRoadmap || []).map((item: any, i: number) => `
                    <div class="flex gap-4">
                        <div class="flex-shrink-0 flex flex-col items-center">
                            <div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-md">${i + 1}</div>
                            ${i < (e.improvementRoadmap.length - 1) ? '<div class="w-0.5 flex-1 bg-emerald-100 my-2"></div>' : ''}
                        </div>
                        <div class="flex-grow bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="font-bold text-gray-800">${item.area}</h3>
                                <span class="text-xs font-bold px-2 py-1 rounded ${item.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                item.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
            }">${getDifficultyBadge(item.difficulty)}</span>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                                <div><span class="text-gray-400">目前:</span> ${item.current}</div>
                                <div><span class="text-gray-400">目標:</span> <span class="text-emerald-600 font-medium">${item.target}</span></div>
                            </div>
                            ${item.action ? `
                            <div class="bg-gray-800 text-gray-300 p-3 rounded-lg font-mono text-xs relative overflow-hidden group">
                                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span class="text-[10px] bg-white/20 px-2 py-1 rounded">PROMPT</span>
                                </div>
                                ${item.action}
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    `).join('')}
                </div>
            </section>

             <!-- Market Value & Scenarios -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section>
                    <h2 class="text-xl font-bold flex items-center gap-2 mb-4 text-gray-700">
                        <span class="bg-amber-100 text-amber-600 p-1.5 rounded-lg">💰</span> 市場價值
                    </h2>
                    <div class="bg-amber-50 rounded-2xl p-6 border border-amber-100">
                        <div class="grid grid-cols-3 gap-2 mb-6">
                            ${[
            { label: '圖庫授權', val: e.marketValue?.estimatedPrice?.stockPhoto },
            { label: '商業授權', val: e.marketValue?.estimatedPrice?.commercial },
            { label: '獨家授權', val: e.marketValue?.estimatedPrice?.exclusive }
        ].map(item => `
                                <div class="bg-white p-3 rounded-lg text-center shadow-sm">
                                    <div class="text-xs text-gray-500 mb-1">${item.label}</div>
                                    <div class="font-bold text-amber-600">${item.val || '-'}</div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between border-b border-amber-200/50 pb-2">
                                <span class="text-gray-600">市場需求</span>
                                <span class="font-medium text-gray-800">${e.marketValue?.demandLevel || '-'}</span>
                            </div>
                            <div class="flex justify-between border-b border-amber-200/50 pb-2">
                                <span class="text-gray-600">競爭力</span>
                                <span class="font-medium text-gray-800">${e.marketValue?.competitiveness || '-'}</span>
                            </div>
                        </div>
                        <div class="mt-4 pt-2">
                             <div class="text-xs text-amber-700 mb-2 font-bold uppercase">建議平台</div>
                             <div class="flex flex-wrap gap-1">
                                ${(e.marketValue?.suitablePlatforms || []).map((p: string) =>
            `<span class="px-2 py-1 bg-white text-amber-800 rounded text-xs border border-amber-100">${p}</span>`
        ).join('')}
                             </div>
                        </div>
                    </div>
                </section>

                <section>
                     <h2 class="text-xl font-bold flex items-center gap-2 mb-4 text-gray-700">
                        <span class="bg-blue-100 text-blue-600 p-1.5 rounded-lg">💬</span> 專家評語
                    </h2>
                    <div class="space-y-4">
                        <div class="bg-green-50 p-4 rounded-xl border-l-4 border-green-400">
                             <h3 class="text-green-800 font-bold text-sm mb-2">✅ 優點</h3>
                             <ul class="text-sm text-gray-700 space-y-1 list-disc pl-4">
                                ${(e.expertComment?.strengths || []).map((s: string) => `<li>${s}</li>`).join('')}
                             </ul>
                        </div>
                        <div class="bg-red-50 p-4 rounded-xl border-l-4 border-red-400">
                             <h3 class="text-red-800 font-bold text-sm mb-2">⚠️ 需注意</h3>
                             <ul class="text-sm text-gray-700 space-y-1 list-disc pl-4">
                                ${(e.expertComment?.weaknesses || []).map((w: string) => `<li>${w}</li>`).join('')}
                             </ul>
                        </div>
                    </div>
                </section>
            </div>

        </div>
        
        <!-- Footer -->
        <div class="bg-gray-100 p-6 text-center text-sm text-gray-500 border-t border-gray-200">
            Prompt Database 全面性評估系統自動生成
        </div>
    </div>
</body>
</html>`;
}

function generateMarkdownReport(eval_: any, imageInfo: any, date: string, time: string): string {
    const e = eval_;


    let report = `# 📊 全面性圖片評估報告

**生成日期**: ${date} ${time}  
**圖片 ID**: ${imageInfo?.id || 'N/A'}

---

## 🎯 總體評價

| 項目 | 評分 |
|------|------|
| **總分** | ${e.overallScore?.total || 'N/A'}/100 |
| **等級** | ${e.overallScore?.grade || 'N/A'} |
| **摘要** | ${e.overallScore?.summary || 'N/A'} |

---

## 📈 五維度評分

| 維度 | 評分 | 評語 |
|------|------|------|
| 🎨 構圖 | ${e.radarScores?.composition?.score || '-'}/10 | ${e.radarScores?.composition?.comment || '-'} |
| 🌈 色彩 | ${e.radarScores?.color?.score || '-'}/10 | ${e.radarScores?.color?.comment || '-'} |
| 💡 創意 | ${e.radarScores?.creativity?.score || '-'}/10 | ${e.radarScores?.creativity?.comment || '-'} |
| ⚙️ 技術 | ${e.radarScores?.technical?.score || '-'}/10 | ${e.radarScores?.technical?.comment || '-'} |
| 💖 情感 | ${e.radarScores?.emotion?.score || '-'}/10 | ${e.radarScores?.emotion?.comment || '-'} |

---

## 🤖 AI 生成檢測

| 項目 | 結果 |
|------|------|
| **是否 AI 生成** | ${e.aiDetection?.isAiGenerated ? '✅ 是' : '❌ 否'} |
| **可信度** | ${Math.round((e.aiDetection?.confidence || 0) * 100)}% |
| **推測工具** | ${e.aiDetection?.aiTool || '無法判斷'} |

**檢測指標**:
${(e.aiDetection?.indicators || []).map((i: string) => `- ${i}`).join('\n') || '- 無'}

---

## ⚠️ 版權風險評估

| 項目 | 結果 |
|------|------|
| **風險等級** | ${getRiskLabel(e.copyrightRisk?.riskLevel)} |
| **風險分數** | ${e.copyrightRisk?.riskScore || 0}/10 |

**潛在問題**:
${(e.copyrightRisk?.concerns || []).map((c: any) => `- **${c.type}** (${getSeverityLabel(c.severity)}): ${c.description}`).join('\n') || '- 無明顯版權風險'}

**使用建議**: ${e.copyrightRisk?.recommendation || '可安全使用'}

---

## 🛠️ 優化路線圖

${(e.improvementRoadmap || []).map((item: any, i: number) => `
### ${i + 1}. ${item.area} ${getDifficultyBadge(item.difficulty)}

- **目前狀態**: ${item.current}
- **改進目標**: ${item.target}
- **預期效果**: ${item.impact}

\`\`\`
${item.action}
\`\`\`
`).join('\n') || '無需改進'}

---

## 📊 競品對比分析

**圖片類別**: ${e.competitorAnalysis?.category || 'N/A'}  
**業界標準**: ${e.competitorAnalysis?.industryStandard || 'N/A'}

### 差距分析

| 面向 | 目前水平 | 業界標準 | 差距 |
|------|----------|----------|------|
${(e.competitorAnalysis?.gapAnalysis || []).map((g: any) =>
        `| ${g.aspect} | ${g.currentLevel}/10 | ${g.industryLevel}/10 | ${g.gap} |`
    ).join('\n') || '| - | - | - | 無數據 |'}

**推薦參考**: ${(e.competitorAnalysis?.benchmarkImages || []).join(', ') || '無'}

---

## 💰 市場價值評估

### 預估定價

| 授權類型 | 價格範圍 (USD) |
|----------|----------------|
| 圖庫標準授權 | ${e.marketValue?.estimatedPrice?.stockPhoto || 'N/A'} |
| 商業授權 | ${e.marketValue?.estimatedPrice?.commercial || 'N/A'} |
| 獨家授權 | ${e.marketValue?.estimatedPrice?.exclusive || 'N/A'} |

**市場需求**: ${e.marketValue?.demandLevel || 'N/A'}  
**競爭力**: ${e.marketValue?.competitiveness || 'N/A'}

**建議上架平台**: ${(e.marketValue?.suitablePlatforms || []).join(', ') || '無'}

**建議關鍵字**: ${(e.marketValue?.suggestedKeywords || []).join(', ') || '無'}

---

## 🎬 使用場景建議

| 場景 | 適合度 | 調整建議 |
|------|--------|----------|
${(e.usageScenarios || []).map((s: any) =>
        `| ${s.scenario} | ${s.suitability}/10 | ${s.adjustments || '無需調整'} |`
    ).join('\n') || '| - | - | 無數據 |'}

---

## 💬 專家評語

### ✅ 優點
${(e.expertComment?.strengths || []).map((s: string) => `- ${s}`).join('\n') || '- 無'}

### ⚠️ 需注意
${(e.expertComment?.weaknesses || []).map((w: string) => `- ${w}`).join('\n') || '- 無'}

### 💡 專業建議
> ${e.expertComment?.professionalTip || '無'}

---

*此報告由 Prompt Database 全面性評估系統自動生成*
`;

    return report;
}

function getRiskLabel(level: string): string {
    const labels: Record<string, string> = {
        'low': '🟢 低風險',
        'medium': '🟡 中風險',
        'high': '🔴 高風險'
    };
    return labels[level] || '⚪ 未知';
}

function getSeverityLabel(severity: string): string {
    const labels: Record<string, string> = {
        'low': '低',
        'medium': '中',
        'high': '高'
    };
    return labels[severity] || '未知';
}

function getDifficultyBadge(difficulty: string): string {
    const badges: Record<string, string> = {
        'easy': '🟢 簡單',
        'medium': '🟡 中等',
        'hard': '🔴 困難'
    };
    return badges[difficulty] || '';
}
