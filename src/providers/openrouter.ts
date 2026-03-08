/**
 * OpenRouter Provider（聚合 800+ 模型）
 * Provider 前缀: openrouter
 * Auth: OPENROUTER_API_KEY 或 OAuth
 */
import { BaseOpenAICompatibleProvider } from './openai.js';
import type { ModelInfo } from './base.js';

// OpenRouter 热门模型（约 40 个，UI 展示用）
export const OPENROUTER_TOP_MODELS: ModelInfo[] = [
    // Anthropic
    { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4', maxTokens: 200000, pricing: { input: 15.0, output: 75.0 }, provider: 'openrouter' },
    { id: 'anthropic/claude-sonnet-4-5', name: 'Claude Sonnet 4.5', maxTokens: 200000, pricing: { input: 3.0, output: 15.0 }, provider: 'openrouter' },
    { id: 'anthropic/claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', maxTokens: 200000, pricing: { input: 3.0, output: 15.0 }, provider: 'openrouter' },
    { id: 'anthropic/claude-3-5-haiku', name: 'Claude 3.5 Haiku', maxTokens: 200000, pricing: { input: 0.8, output: 4.0 }, provider: 'openrouter' },
    // OpenAI
    { id: 'openai/gpt-4o', name: 'GPT-4o', maxTokens: 128000, pricing: { input: 2.5, output: 10.0 }, provider: 'openrouter' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', maxTokens: 128000, pricing: { input: 0.15, output: 0.6 }, provider: 'openrouter' },
    { id: 'openai/o3', name: 'o3', maxTokens: 200000, pricing: { input: 10.0, output: 40.0 }, provider: 'openrouter' },
    { id: 'openai/o3-mini', name: 'o3-mini', maxTokens: 200000, pricing: { input: 1.1, output: 4.4 }, provider: 'openrouter' },
    { id: 'openai/o4-mini', name: 'o4-mini', maxTokens: 200000, pricing: { input: 1.1, output: 4.4 }, provider: 'openrouter' },
    // Google
    { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro Preview', maxTokens: 1000000, pricing: { input: 1.25, output: 10.0 }, provider: 'openrouter' },
    { id: 'google/gemini-2.5-flash-preview', name: 'Gemini 2.5 Flash Preview', maxTokens: 1000000, pricing: { input: 0.15, output: 0.6 }, provider: 'openrouter' },
    { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', maxTokens: 1000000, pricing: { input: 0.1, output: 0.4 }, provider: 'openrouter' },
    // xAI
    { id: 'x-ai/grok-3', name: 'Grok 3', maxTokens: 131072, pricing: { input: 3.0, output: 15.0 }, provider: 'openrouter' },
    { id: 'x-ai/grok-3-mini', name: 'Grok 3 Mini', maxTokens: 131072, pricing: { input: 0.3, output: 0.5 }, provider: 'openrouter' },
    // DeepSeek
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', maxTokens: 163840, pricing: { input: 0.5, output: 2.15 }, provider: 'openrouter' },
    { id: 'deepseek/deepseek-v3', name: 'DeepSeek V3', maxTokens: 163840, pricing: { input: 0.27, output: 1.1 }, provider: 'openrouter' },
    { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (免费)', maxTokens: 163840, pricing: { input: 0, output: 0 }, provider: 'openrouter' },
    // Meta Llama
    { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', maxTokens: 524288, pricing: { input: 0.19, output: 0.49 }, provider: 'openrouter' },
    { id: 'meta-llama/llama-4-scout', name: 'Llama 4 Scout', maxTokens: 524288, pricing: { input: 0.08, output: 0.3 }, provider: 'openrouter' },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', maxTokens: 131072, pricing: { input: 0.12, output: 0.3 }, provider: 'openrouter' },
    { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (免费)', maxTokens: 131072, pricing: { input: 0, output: 0 }, provider: 'openrouter' },
    // Mistral
    { id: 'mistralai/mistral-large', name: 'Mistral Large', maxTokens: 131072, pricing: { input: 2.0, output: 6.0 }, provider: 'openrouter' },
    { id: 'mistralai/codestral-2501', name: 'Codestral 2501', maxTokens: 256000, pricing: { input: 0.3, output: 0.9 }, provider: 'openrouter' },
    // Qwen
    { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', maxTokens: 131072, pricing: { input: 0.4, output: 0.4 }, provider: 'openrouter' },
    { id: 'qwen/qwq-32b', name: 'QwQ-32B（推理）', maxTokens: 131072, pricing: { input: 0.12, output: 0.18 }, provider: 'openrouter' },
    // MiniMax / Moonshot
    { id: 'minimax/minimax-text-01', name: 'MiniMax Text-01', maxTokens: 1000192, pricing: { input: 0.2, output: 1.1 }, provider: 'openrouter' },
    // Microsoft / Nvidia
    { id: 'microsoft/phi-4', name: 'Phi 4', maxTokens: 16384, pricing: { input: 0.07, output: 0.14 }, provider: 'openrouter' },
    { id: 'microsoft/mai-ds-r1:free', name: 'MAI-DS-R1 (免费)', maxTokens: 163840, pricing: { input: 0, output: 0 }, provider: 'openrouter' },
    // Free tier
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (免费)', maxTokens: 1000000, pricing: { input: 0, output: 0 }, provider: 'openrouter' },
];

export class OpenRouterProvider extends BaseOpenAICompatibleProvider {
    readonly name = 'OpenRouter';
    private readonly orApiKey: string;

    constructor(apiKey: string) {
        super(apiKey, 'https://openrouter.ai/api/v1', {
            'HTTP-Referer': 'https://github.com/ai-meanless/token-burner',
            'X-Title': 'Token Burner',
        });
        this.orApiKey = apiKey;
    }

    override async listModels(): Promise<ModelInfo[]> {
        return OPENROUTER_TOP_MODELS;
    }

    /** 动态从 OpenRouter 拉取全量模型，供搜索使用 */
    async fetchAllModels(): Promise<ModelInfo[]> {
        try {
            const res = await fetch('https://openrouter.ai/api/v1/models', {
                headers: { Authorization: `Bearer ${this.orApiKey}` },
                signal: AbortSignal.timeout(10000),
            });
            if (!res.ok) return OPENROUTER_TOP_MODELS;
            const data = await res.json() as { data: Array<{ id: string; name: string; context_length: number; pricing?: { prompt: string; completion: string } }> };
            return data.data.map(m => ({
                id: m.id,
                name: m.name || m.id,
                maxTokens: m.context_length || 131072,
                pricing: m.pricing ? {
                    input: parseFloat(m.pricing.prompt) * 1e6,
                    output: parseFloat(m.pricing.completion) * 1e6,
                } : { input: 0, output: 0 },
                provider: 'openrouter',
            }));
        } catch {
            return OPENROUTER_TOP_MODELS;
        }
    }
}
