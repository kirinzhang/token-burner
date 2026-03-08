/**
 * Moonshot AI (Kimi) 直连 Provider
 * Provider 前缀: moonshot
 * Auth: MOONSHOT_API_KEY
 */

import { BaseOpenAICompatibleProvider } from './openai.js';
import type { ModelInfo } from './base.js';

const MOONSHOT_MODELS: ModelInfo[] = [
    { id: 'kimi-k2-0905-preview', name: 'Kimi K2', maxTokens: 131072, pricing: { input: 0.60, output: 2.50 }, provider: 'moonshot' },
    { id: 'kimi-k2-turbo-preview', name: 'Kimi K2 Turbo', maxTokens: 131072, pricing: { input: 0.30, output: 1.50 }, provider: 'moonshot' },
    { id: 'moonshot-v1-128k', name: 'Moonshot v1 128K', maxTokens: 131072, pricing: { input: 0.20, output: 0.20 }, provider: 'moonshot' },
    { id: 'moonshot-v1-32k', name: 'Moonshot v1 32K', maxTokens: 32768, pricing: { input: 0.12, output: 0.12 }, provider: 'moonshot' },
    { id: 'moonshot-v1-8k', name: 'Moonshot v1 8K', maxTokens: 8192, pricing: { input: 0.12, output: 0.12 }, provider: 'moonshot' },
];

export class MoonshotProvider extends BaseOpenAICompatibleProvider {
    readonly name = 'Moonshot (Kimi)';

    constructor(apiKey: string) {
        super(apiKey, 'https://api.moonshot.ai/v1');
    }

    override async listModels(): Promise<ModelInfo[]> {
        return MOONSHOT_MODELS;
    }
}
