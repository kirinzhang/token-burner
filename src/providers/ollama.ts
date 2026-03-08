/**
 * Ollama 本地 Provider（无需 API Key）
 * Provider 前缀: ollama
 * Base URL: http://127.0.0.1:11434/v1
 */
import { BaseOpenAICompatibleProvider } from './openai.js';
import type { ModelInfo } from './base.js';

// 常见 Ollama 模型（用户需自行 ollama pull）
const OLLAMA_KNOWN_MODELS: ModelInfo[] = [
    { id: 'llama3.2', name: 'Llama 3.2 3B', maxTokens: 131072, pricing: { input: 0, output: 0 }, provider: 'ollama' },
    { id: 'llama3.1:8b', name: 'Llama 3.1 8B', maxTokens: 131072, pricing: { input: 0, output: 0 }, provider: 'ollama' },
    { id: 'llama3.1:70b', name: 'Llama 3.1 70B', maxTokens: 131072, pricing: { input: 0, output: 0 }, provider: 'ollama' },
    { id: 'qwen2.5:7b', name: 'Qwen 2.5 7B', maxTokens: 131072, pricing: { input: 0, output: 0 }, provider: 'ollama' },
    { id: 'deepseek-r1:7b', name: 'DeepSeek R1 7B', maxTokens: 131072, pricing: { input: 0, output: 0 }, provider: 'ollama' },
    { id: 'mistral:7b', name: 'Mistral 7B', maxTokens: 32768, pricing: { input: 0, output: 0 }, provider: 'ollama' },
    { id: 'gemma2:9b', name: 'Gemma 2 9B', maxTokens: 8192, pricing: { input: 0, output: 0 }, provider: 'ollama' },
    { id: 'phi3.5', name: 'Phi 3.5 Mini', maxTokens: 131072, pricing: { input: 0, output: 0 }, provider: 'ollama' },
];

export class OllamaProvider extends BaseOpenAICompatibleProvider {
    readonly name = 'Ollama（本地）';
    private readonly ollamaBaseUrl: string;

    constructor(baseUrl = 'http://127.0.0.1:11434/v1') {
        super('ollama', baseUrl);
        this.ollamaBaseUrl = baseUrl;
    }

    override async listModels(): Promise<ModelInfo[]> {
        // 优先从本地 Ollama 动态拉取
        try {
            const tagsUrl = this.ollamaBaseUrl.replace('/v1', '') + '/api/tags';
            const res = await fetch(tagsUrl, { signal: AbortSignal.timeout(3000) });
            if (res.ok) {
                const data = await res.json() as { models?: { name: string }[] };
                if (data.models && data.models.length > 0) {
                    return data.models.map(m => ({
                        id: m.name,
                        name: m.name,
                        maxTokens: 131072,
                        pricing: { input: 0, output: 0 },
                        provider: 'ollama',
                    }));
                }
            }
        } catch {
            // 本地 Ollama 未启动时回退到静态列表
        }
        return OLLAMA_KNOWN_MODELS;
    }
}
