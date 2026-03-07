/**
 * 费用计算器 — 基于模型价格信息的实时费用计算
 */

import { MODEL_PRICING } from '../config/default.js';

export interface CostBreakdown {
    inputTokens: number;
    outputTokens: number;
    inputCostUsd: number;
    outputCostUsd: number;
    totalCostUsd: number;
    model: string;
}

/**
 * 计算单次调用费用
 */
export function calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number
): CostBreakdown {
    const pricing = MODEL_PRICING[model];

    if (!pricing) {
        // 未知模型使用 gpt-4o-mini 价格作为兜底
        const fallback = MODEL_PRICING['gpt-4o-mini']!;
        return {
            inputTokens,
            outputTokens,
            inputCostUsd: (inputTokens / 1_000_000) * fallback.input,
            outputCostUsd: (outputTokens / 1_000_000) * fallback.output,
            totalCostUsd:
                (inputTokens / 1_000_000) * fallback.input +
                (outputTokens / 1_000_000) * fallback.output,
            model,
        };
    }

    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;

    return {
        inputTokens,
        outputTokens,
        inputCostUsd: inputCost,
        outputCostUsd: outputCost,
        totalCostUsd: inputCost + outputCost,
        model,
    };
}

/**
 * 预估消耗目标的总费用
 * @param model 模型名称
 * @param targetTokens 目标消耗 Token 总量
 * @param inputOutputRatio 输入/输出 Token 比例（默认 1:1）
 */
export function estimateTotalCost(
    model: string,
    targetTokens: number,
    inputOutputRatio = 1
): CostBreakdown {
    const totalParts = 1 + inputOutputRatio;
    const outputTokens = Math.floor(targetTokens / totalParts);
    const inputTokens = targetTokens - outputTokens;

    return calculateCost(model, inputTokens, outputTokens);
}

/**
 * 格式化费用为人类可读字符串
 */
export function formatCost(usd: number): string {
    if (usd < 0.01) return `$${usd.toFixed(6)}`;
    if (usd < 1) return `$${usd.toFixed(4)}`;
    return `$${usd.toFixed(2)}`;
}

/**
 * 获取模型价格描述（每 1M Token）
 */
export function getModelPriceDescription(model: string): string {
    const pricing = MODEL_PRICING[model];
    if (!pricing) return '价格未知';
    return `输入 $${pricing.input}/1M · 输出 $${pricing.output}/1M`;
}
