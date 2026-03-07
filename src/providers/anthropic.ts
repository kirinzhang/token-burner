/**
 * Anthropic Claude 直连 Provider
 * 使用 OpenAI 兼容接口
 */

import { BaseOpenAICompatibleProvider } from './openai.js';
import type { ModelInfo } from './base.js';

const ANTHROPIC_MODELS: ModelInfo[] = [
    { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', maxTokens: 8096, pricing: { input: 3.00, output: 15.00 }, provider: 'Anthropic' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', maxTokens: 8096, pricing: { input: 3.00, output: 15.00 }, provider: 'Anthropic' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', maxTokens: 8096, pricing: { input: 0.80, output: 4.00 }, provider: 'Anthropic' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', maxTokens: 4096, pricing: { input: 15.00, output: 75.00 }, provider: 'Anthropic' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', maxTokens: 4096, pricing: { input: 0.25, output: 1.25 }, provider: 'Anthropic' },
];

export class AnthropicProvider extends BaseOpenAICompatibleProvider {
    readonly name = 'Anthropic';

    constructor(apiKey: string) {
        super(apiKey, 'https://api.anthropic.com/v1', {
            'anthropic-version': '2023-06-01',
        });
    }

    override async listModels(): Promise<ModelInfo[]> {
        return ANTHROPIC_MODELS;
    }
}
