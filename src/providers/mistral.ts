/**
 * Mistral AI Provider
 * Provider 前缀: mistral
 * Auth: MISTRAL_API_KEY
 */
import { BaseOpenAICompatibleProvider } from './openai.js';
import type { ModelInfo } from './base.js';

const MISTRAL_MODELS: ModelInfo[] = [
    { id: 'mistral-large-latest', name: 'Mistral Large', maxTokens: 131072, pricing: { input: 2.0, output: 6.0 }, provider: 'mistral' },
    { id: 'mistral-small-latest', name: 'Mistral Small', maxTokens: 131072, pricing: { input: 0.1, output: 0.3 }, provider: 'mistral' },
    { id: 'codestral-latest', name: 'Codestral', maxTokens: 256000, pricing: { input: 0.3, output: 0.9 }, provider: 'mistral' },
    { id: 'mistral-nemo', name: 'Mistral Nemo（12B）', maxTokens: 131072, pricing: { input: 0.15, output: 0.15 }, provider: 'mistral' },
    { id: 'open-mistral-7b', name: 'Mistral 7B（开源）', maxTokens: 32768, pricing: { input: 0.25, output: 0.25 }, provider: 'mistral' },
    { id: 'open-mixtral-8x7b', name: 'Mixtral 8x7B（MoE）', maxTokens: 32768, pricing: { input: 0.7, output: 0.7 }, provider: 'mistral' },
    { id: 'mistral-embed', name: 'Mistral Embed', maxTokens: 8192, pricing: { input: 0.1, output: 0.0 }, provider: 'mistral' },
];

export class MistralProvider extends BaseOpenAICompatibleProvider {
    readonly name = 'Mistral AI';

    constructor(apiKey: string) {
        super(apiKey, 'https://api.mistral.ai/v1');
    }

    override async listModels(): Promise<ModelInfo[]> {
        return MISTRAL_MODELS;
    }
}
