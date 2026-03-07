/**
 * OpenAI 兼容 Provider 基类 + OpenAI 直连实现
 *
 * 所有 OpenAI-compatible Provider（OpenRouter/Anthropic/Gemini/MiniMax/GLM/DeepSeek）
 * 均继承 BaseOpenAICompatibleProvider，只需覆盖 name / baseURL / defaultHeaders。
 */

import OpenAI from 'openai';
import { MODEL_PRICING } from '../config/default.js';
import { logger } from '../utils/logger.js';
import type { AIProvider, ModelInfo, PromptPayload, ConsumeResult } from './base.js';

// ===================== 基类 =====================

export abstract class BaseOpenAICompatibleProvider implements AIProvider {
    abstract readonly name: string;
    protected client: OpenAI;

    constructor(apiKey: string, baseURL?: string, defaultHeaders?: Record<string, string>) {
        this.client = new OpenAI({
            apiKey,
            baseURL: baseURL || 'https://api.openai.com/v1',
            defaultHeaders,
        });
    }

    async listModels(): Promise<ModelInfo[]> {
        return [];
    }

    async sendMessage(payload: PromptPayload): Promise<ConsumeResult> {
        const startTime = Date.now();
        try {
            const response = await this.client.chat.completions.create({
                model: payload.model,
                messages: payload.messages,
                max_tokens: payload.maxTokens ?? 4096,
                temperature: payload.temperature ?? 0.7,
            });

            const usage = response.usage;
            const content = response.choices[0]?.message?.content ?? '';

            return {
                content,
                inputTokens: usage?.prompt_tokens ?? 0,
                outputTokens: usage?.completion_tokens ?? 0,
                totalTokens: usage?.total_tokens ?? 0,
                model: payload.model,
                durationMs: Date.now() - startTime,
            };
        } catch (error) {
            const err = error as Error;
            logger.error(`[${this.name}] API 调用失败: ${err.message}`);
            throw error;
        }
    }

    getCostPerToken(model: string): { input: number; output: number } {
        return MODEL_PRICING[model] ?? MODEL_PRICING['gpt-4o-mini']!;
    }

    async testConnection(): Promise<boolean> {
        try {
            // 发一个极小的请求来测试连通性
            await this.client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: 'hi' }],
                max_tokens: 1,
            });
            return true;
        } catch {
            return false;
        }
    }
}

// ===================== OpenAI 直连实现 =====================

const OPENAI_MODELS: ModelInfo[] = [
    { id: 'gpt-4o', name: 'GPT-4o', maxTokens: 16384, pricing: { input: 2.50, output: 10.00 } },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', maxTokens: 16384, pricing: { input: 0.15, output: 0.60 } },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', maxTokens: 4096, pricing: { input: 10.00, output: 30.00 } },
    { id: 'gpt-4.5-preview', name: 'GPT-4.5 Preview', maxTokens: 16384, pricing: { input: 75.00, output: 150.00 } },
    { id: 'o1', name: 'o1', maxTokens: 32768, pricing: { input: 15.00, output: 60.00 } },
    { id: 'o1-mini', name: 'o1-mini', maxTokens: 65536, pricing: { input: 3.00, output: 12.00 } },
    { id: 'o3-mini', name: 'o3-mini', maxTokens: 100000, pricing: { input: 1.10, output: 4.40 } },
];

export class OpenAIProvider extends BaseOpenAICompatibleProvider {
    readonly name = 'OpenAI';

    constructor(apiKey: string) {
        super(apiKey, 'https://api.openai.com/v1');
    }

    override async listModels(): Promise<ModelInfo[]> {
        return OPENAI_MODELS;
    }

    override async testConnection(): Promise<boolean> {
        try {
            await this.client.models.list();
            return true;
        } catch {
            return false;
        }
    }
}
