import { prisma } from "@/lib/prisma";

// Pricing per 1M tokens (USD)
const PRICING = {
    "gpt-3.5-turbo": { input: 0.50, output: 1.50 },
    "gpt-4o": { input: 5.00, output: 15.00 },
    "gpt-4o-mini": { input: 0.15, output: 0.60 },
};

export async function trackUsage(
    userId: string | null,
    model: string,
    promptTokens: number,
    completionTokens: number,
    action: string = "generate"
) {
    try {
        const price = PRICING[model as keyof typeof PRICING] || PRICING["gpt-3.5-turbo"];
        const cost = (promptTokens / 1_000_000 * price.input) + (completionTokens / 1_000_000 * price.output);

        await prisma.tokenUsage.create({
            data: {
                userId,
                model,
                promptTokens,
                completionTokens,
                totalTokens: promptTokens + completionTokens,
                cost,
                action,
            },
        });

        console.log(`[trackUsage] 💰 Recorded usage: $${cost.toFixed(6)} (${promptTokens}+${completionTokens} tokens)`);
    } catch (e) {
        console.error("[trackUsage] ❌ Failed to record usage:", e);
    }
}

export async function getTotalUsage(userId?: string) {
    const where = userId ? { userId } : {};
    const aggregate = await prisma.tokenUsage.aggregate({
        where,
        _sum: {
            totalTokens: true,
            cost: true,
        },
    });

    return {
        tokens: aggregate._sum.totalTokens || 0,
        cost: aggregate._sum.cost || 0,
    };
}
