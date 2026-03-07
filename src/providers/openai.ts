/**
 * OpenAI Provider 适配器
 */

import OpenAI from 'openai';
import { MODEL_PRICING } from '../config/default.js';
import { logger } from '../utils/logger.js';
import type { AIProvider, ModelInfo, PromptPayload, ConsumeResult } from './base.js';

const OPENAI_MODELS: ModelInfo[] = [
    { id: 'gpt-4o', name: 'GPT-4o', maxTokens: 16384, pricing: { input: 2.50, output: 10.00 } },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', maxTokens: 16384, pricing: { input: 0.15, output: 0.60 } },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', maxTokens: 4096, pricing: { input: 10.00, output: 30.00 } },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 4096, pricing: { input: 0.50, output: 1.50 } },
    { id: 'o3-mini', name: 'o3-mini', maxTokens: 16384, pricing: { input: 1.10, output: 4.40 } },
];

export class OpenAIProvider implements AIProvider {
    readonly name = 'OpenAI';
    private client: OpenAI;

    constructor(apiKey: string, baseUrl?: string) {
        this.client = new OpenAI({
            apiKey,
            baseURL: baseUrl || undefined,
        });
    }

    async listModels(): Promise<ModelInfo[]> {
        return OPENAI_MODELS;
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
            logger.error(`API 调用失败: ${err.message}`);
            throw error;
        }
    }

    getCostPerToken(model: string): { input: number; output: number } {
        const pricing = MODEL_PRICING[model];
        if (!pricing) {
            return MODEL_PRICING['gpt-4o-mini']!;
        }
        return pricing;
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.client.models.list();
            return true;
        } catch {
            return false;
        }
    }
}
