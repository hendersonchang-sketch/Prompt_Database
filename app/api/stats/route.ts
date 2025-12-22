import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Count prompts generated today
        const count = await prisma.promptEntry.count({
            where: {
                createdAt: {
                    gte: startOfDay
                }
            }
        });

        // Calculate time until reset (Midnight tomorrow)
        const tomorrow = new Date(startOfDay);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const msUntilReset = tomorrow.getTime() - now.getTime();
        const hoursUntilReset = Math.floor(msUntilReset / (1000 * 60 * 60));
        const minutesUntilReset = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60));

        return NextResponse.json({
            dailyCount: count,
            dailyLimit: 70, // Hard limit for testing/Free tier
            resetTime: `${hoursUntilReset}h ${minutesUntilReset}m`
        });
    } catch (error) {
        console.error("Failed to fetch stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
