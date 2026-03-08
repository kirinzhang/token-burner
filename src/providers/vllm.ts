/**
 * vLLM 本地 Provider（无需 API Key）
 * Provider 前缀: vllm
 * Base URL: http://127.0.0.1:8000/v1
 */
import { BaseOpenAICompatibleProvider } from './openai.js';
import type { ModelInfo } from './base.js';

export class VLLMProvider extends BaseOpenAICompatibleProvider {
    readonly name = 'vLLM（本地）';
    private readonly vllmBaseUrl: string;

    constructor(baseUrl = 'http://127.0.0.1:8000/v1') {
        super('EMPTY', baseUrl);
        this.vllmBaseUrl = baseUrl;
    }

    override async listModels(): Promise<ModelInfo[]> {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 1500);
            const res = await fetch(`${this.vllmBaseUrl}/models`, {
                headers: { Authorization: 'Bearer EMPTY' },
                signal: controller.signal,
            });
            clearTimeout(timer);
            if (res.ok) {
                const data = await res.json() as { data: Array<{ id: string }> };
                return data.data.map(m => ({
                    id: m.id,
                    name: m.id,
                    maxTokens: 131072,
                    pricing: { input: 0, output: 0 },
                    provider: 'vllm',
                }));
            }
        } catch {
            // vLLM 未启动
        }
        return [{
            id: 'local-model',
            name: '本地模型（vLLM 未启动）',
            maxTokens: 131072,
            pricing: { input: 0, output: 0 },
            provider: 'vllm',
        }];
    }
}
