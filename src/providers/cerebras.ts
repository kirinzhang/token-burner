/**
 * Cerebras Provider（超快推理，支持 GLM 模型）
 * Provider 前缀: cerebras
 * Auth: CEREBRAS_API_KEY
 * Base URL: https://api.cerebras.ai/v1
 */
import { BaseOpenAICompatibleProvider } from './openai.js';
import type { ModelInfo } from './base.js';

const CEREBRAS_MODELS: ModelInfo[] = [
    { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', maxTokens: 131072, pricing: { input: 0.59, output: 0.99 }, provider: 'cerebras' },
    { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', maxTokens: 131072, pricing: { input: 0.1, output: 0.1 }, provider: 'cerebras' },
    { id: 'llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout 17B', maxTokens: 131072, pricing: { input: 0.27, output: 0.85 }, provider: 'cerebras' },
    { id: 'qwen-3-32b', name: 'Qwen 3 32B', maxTokens: 131072, pricing: { input: 0.4, output: 0.8 }, provider: 'cerebras' },
    { id: 'zai-glm-4.7', name: 'GLM-4.7 (Cerebras)', maxTokens: 131072, pricing: { input: 0.5, output: 1.5 }, provider: 'cerebras' },
    { id: 'zai-glm-4.6', name: 'GLM-4.6 (Cerebras)', maxTokens: 131072, pricing: { input: 0.5, output: 1.5 }, provider: 'cerebras' },
];

export class CerebrasProvider extends BaseOpenAICompatibleProvider {
    readonly name = 'Cerebras';

    constructor(apiKey: string) {
        super(apiKey, 'https://api.cerebras.ai/v1');
    }

    override async listModels(): Promise<ModelInfo[]> {
        return CEREBRAS_MODELS;
    }
}
