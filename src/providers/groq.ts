/**
 * Groq Provider（超高推理速度）
 * Provider 前缀: groq
 * Auth: GROQ_API_KEY
 */
import { BaseOpenAICompatibleProvider } from './openai.js';
import type { ModelInfo } from './base.js';

const GROQ_MODELS: ModelInfo[] = [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', maxTokens: 32768, pricing: { input: 0.59, output: 0.79 }, provider: 'groq' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', maxTokens: 131072, pricing: { input: 0.05, output: 0.08 }, provider: 'groq' },
    { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 (Groq)', maxTokens: 131072, pricing: { input: 0.75, output: 0.99 }, provider: 'groq' },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B', maxTokens: 8192, pricing: { input: 0.2, output: 0.2 }, provider: 'groq' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (Groq)', maxTokens: 32768, pricing: { input: 0.24, output: 0.24 }, provider: 'groq' },
    { id: 'qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder 32B', maxTokens: 128000, pricing: { input: 0.79, output: 0.79 }, provider: 'groq' },
];

export class GroqProvider extends BaseOpenAICompatibleProvider {
    readonly name = 'Groq';

    constructor(apiKey: string) {
        super(apiKey, 'https://api.groq.com/openai/v1');
    }

    override async listModels(): Promise<ModelInfo[]> {
        return GROQ_MODELS;
    }
}
