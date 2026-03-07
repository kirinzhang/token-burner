/**
 * GLM (智谱 AI) 直连 Provider
 * 使用 OpenAI 兼容接口
 */

import { BaseOpenAICompatibleProvider } from './openai.js';
import type { ModelInfo } from './base.js';

const GLM_MODELS: ModelInfo[] = [
    { id: 'glm-4-plus', name: 'GLM-4 Plus', maxTokens: 128000, pricing: { input: 0.14, output: 0.14 }, provider: 'Zhipu' },
    { id: 'glm-4-air', name: 'GLM-4 Air', maxTokens: 128000, pricing: { input: 0.014, output: 0.014 }, provider: 'Zhipu' },
    { id: 'glm-4-flash', name: 'GLM-4 Flash（免费）', maxTokens: 128000, pricing: { input: 0.00, output: 0.00 }, provider: 'Zhipu' },
    { id: 'glm-z1-flash', name: 'GLM-Z1 Flash（推理）', maxTokens: 32768, pricing: { input: 0.00, output: 0.00 }, provider: 'Zhipu' },
    { id: 'glm-z1-air', name: 'GLM-Z1 Air（推理）', maxTokens: 32768, pricing: { input: 0.014, output: 0.014 }, provider: 'Zhipu' },
    { id: 'glm-z1-plus', name: 'GLM-Z1 Plus（推理）', maxTokens: 32768, pricing: { input: 0.14, output: 0.14 }, provider: 'Zhipu' },
];

export class GLMProvider extends BaseOpenAICompatibleProvider {
    readonly name = 'GLM (智谱)';

    constructor(apiKey: string) {
        super(apiKey, 'https://open.bigmodel.cn/api/paas/v4');
    }

    override async listModels(): Promise<ModelInfo[]> {
        return GLM_MODELS;
    }
}
