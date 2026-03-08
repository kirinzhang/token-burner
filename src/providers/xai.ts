/**
 * xAI (Grok) Provider
 * Provider 前缀: xai
 * Auth: XAI_API_KEY
 */
import { BaseOpenAICompatibleProvider } from './openai.js';
import type { ModelInfo } from './base.js';

export const XAI_MODELS: ModelInfo[] = [
    { id: 'grok-3', name: 'Grok 3', maxTokens: 131072, pricing: { input: 3.0, output: 15.0 }, provider: 'xai' },
    { id: 'grok-3-mini', name: 'Grok 3 Mini', maxTokens: 131072, pricing: { input: 0.3, output: 0.5 }, provider: 'xai' },
    { id: 'grok-3-fast', name: 'Grok 3 Fast', maxTokens: 131072, pricing: { input: 5.0, output: 25.0 }, provider: 'xai' },
    { id: 'grok-3-mini-fast', name: 'Grok 3 Mini Fast', maxTokens: 131072, pricing: { input: 0.6, output: 4.0 }, provider: 'xai' },
    { id: 'grok-2-vision-1212', name: 'Grok 2 Vision', maxTokens: 32768, pricing: { input: 2.0, output: 10.0 }, provider: 'xai' },
];

export class XAIProvider extends BaseOpenAICompatibleProvider {
    readonly name = 'xAI (Grok)';

    constructor(apiKey: string) {
        super(apiKey, 'https://api.x.ai/v1');
    }

    override async listModels(): Promise<ModelInfo[]> {
        return XAI_MODELS;
    }
}
