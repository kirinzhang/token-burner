/**
 * DeepSeek 直连 Provider
 * 使用 OpenAI 兼容接口
 */

import { BaseOpenAICompatibleProvider } from './openai.js';
import type { ModelInfo } from './base.js';

const DEEPSEEK_MODELS: ModelInfo[] = [
    { id: 'deepseek-reasoner', name: 'DeepSeek R1', maxTokens: 8192, pricing: { input: 0.55, output: 2.19 }, provider: 'DeepSeek' },
    { id: 'deepseek-chat', name: 'DeepSeek V3', maxTokens: 65536, pricing: { input: 0.27, output: 1.10 }, provider: 'DeepSeek' },
];

export class DeepSeekProvider extends BaseOpenAICompatibleProvider {
    readonly name = 'DeepSeek';

    constructor(apiKey: string) {
        super(apiKey, 'https://api.deepseek.com/v1');
    }

    override async listModels(): Promise<ModelInfo[]> {
        return DEEPSEEK_MODELS;
    }
}
