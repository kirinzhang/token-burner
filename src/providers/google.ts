/**
 * Google Gemini 直连 Provider
 * 使用 Google 的 OpenAI 兼容接口
 */

import { BaseOpenAICompatibleProvider } from './openai.js';
import type { ModelInfo } from './base.js';

export const GOOGLE_MODELS: ModelInfo[] = [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', maxTokens: 8192, pricing: { input: 0.10, output: 0.40 }, provider: 'Google' },
    { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite', maxTokens: 8192, pricing: { input: 0.075, output: 0.30 }, provider: 'Google' },
    { id: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro Exp', maxTokens: 8192, pricing: { input: 0.00, output: 0.00 }, provider: 'Google' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', maxTokens: 8192, pricing: { input: 1.25, output: 5.00 }, provider: 'Google' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', maxTokens: 8192, pricing: { input: 0.075, output: 0.30 }, provider: 'Google' },
    { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash-8B', maxTokens: 8192, pricing: { input: 0.0375, output: 0.15 }, provider: 'Google' },
];

export class GoogleProvider extends BaseOpenAICompatibleProvider {
    readonly name = 'Google';

    constructor(apiKey: string) {
        super(
            apiKey,
            `https://generativelanguage.googleapis.com/v1beta/openai/`,
        );
    }

    override async listModels(): Promise<ModelInfo[]> {
        return GOOGLE_MODELS;
    }
}
