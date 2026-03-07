/**
 * Token 计数器 — 基于 tiktoken 精确计算 Token 数量
 */

import { encoding_for_model, type TiktokenModel } from 'tiktoken';

// 缓存编码器实例，避免重复创建
const encoderCache = new Map<string, ReturnType<typeof encoding_for_model>>();

function getEncoder(model: string) {
    if (encoderCache.has(model)) {
        return encoderCache.get(model)!;
    }

    try {
        const encoder = encoding_for_model(model as TiktokenModel);
        encoderCache.set(model, encoder);
        return encoder;
    } catch {
        // 未知模型回退到 cl100k_base（GPT-4 / GPT-3.5 通用编码）
        const fallback = encoding_for_model('gpt-4o' as TiktokenModel);
        encoderCache.set(model, fallback);
        return fallback;
    }
}

/**
 * 计算文本的 Token 数量
 */
export function countTokens(text: string, model = 'gpt-4o-mini'): number {
    const encoder = getEncoder(model);
    return encoder.encode(text).length;
}

/**
 * 批量计算多段文本的 Token 总数
 */
export function countTokensBatch(texts: string[], model = 'gpt-4o-mini'): number {
    return texts.reduce((sum, text) => sum + countTokens(text, model), 0);
}

/**
 * 估算消息数组的 Token 数（含角色标记开销）
 * OpenAI 消息格式每条约有 4 Token 额外开销
 */
export function countMessageTokens(
    messages: Array<{ role: string; content: string }>,
    model = 'gpt-4o-mini'
): number {
    const TOKENS_PER_MESSAGE = 4;
    let total = 0;

    for (const msg of messages) {
        total += TOKENS_PER_MESSAGE;
        total += countTokens(msg.content, model);
        total += countTokens(msg.role, model);
    }

    // 每次请求有 2 Token 的回复引导开销
    total += 2;
    return total;
}
