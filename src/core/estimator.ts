/**
 * 成本估算器 — 消耗前预估费用和时间
 */

import { MODEL_PRICING } from '../config/default.js';
import { formatCost } from '../utils/cost-calculator.js';

export interface EstimateResult {
    targetTokens: number;
    model: string;
    estimatedCostUsd: number;
    estimatedCostFormatted: string;
    estimatedTimeMinutes: number;
    estimatedTimeFormatted: string;
    tokensPerCall: number;
    estimatedCalls: number;
    pricePerMillionInput: number;
    pricePerMillionOutput: number;
    /** 伪装延迟范围（ms），0 表示无延迟 */
    camouflageDelayMs: number;
}

/**
 * 预估消耗任务的费用和时间
 * @param targetTokens 目标 Token 量
 * @param model 模型名称
 * @param tokensPerCall 每次调用预估消耗的 Token 数
 * @param camouflageDelayMs 伪装延迟（ms，仅用于展示，不计入预估时间）
 * @param apiCallDurationMs 实际 API 响应时间（ms，默认 4000）
 */
export function estimateTask(
    targetTokens: number,
    model: string,
    tokensPerCall: number,
    camouflageDelayMs: number,
    apiCallDurationMs = 4_000,
): EstimateResult {
    const pricing = MODEL_PRICING[model] ?? MODEL_PRICING['gpt-4o-mini']!;

    const inputRatio = 0.35;
    const outputRatio = 0.65;

    const inputTokens = targetTokens * inputRatio;
    const outputTokens = targetTokens * outputRatio;

    const costUsd =
        (inputTokens / 1_000_000) * pricing.input +
        (outputTokens / 1_000_000) * pricing.output;

    const estimatedCalls = Math.ceil(targetTokens / tokensPerCall);
    // 方案 A：只算实际 API 调用时间，不把伪装延迟计入预估
    const totalTimeMs = estimatedCalls * apiCallDurationMs;
    const totalTimeMinutes = totalTimeMs / 60_000;

    return {
        targetTokens,
        model,
        estimatedCostUsd: costUsd,
        estimatedCostFormatted: formatCost(costUsd),
        estimatedTimeMinutes: totalTimeMinutes,
        estimatedTimeFormatted: formatTime(totalTimeMinutes),
        tokensPerCall,
        estimatedCalls,
        pricePerMillionInput: pricing.input,
        pricePerMillionOutput: pricing.output,
        camouflageDelayMs,
    };
}

function formatTime(minutes: number): string {
    if (minutes < 1) return `${Math.round(minutes * 60)} 秒`;
    if (minutes < 60) return `${Math.round(minutes)} 分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours} 小时 ${mins} 分钟`;
}
