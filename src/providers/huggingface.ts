/**
 * Hugging Face Inference Provider
 * Provider 前缀: huggingface
 * Auth: HF_TOKEN / HUGGINGFACE_HUB_TOKEN
 * OpenAI-compatible router
 */
import { BaseOpenAICompatibleProvider } from './openai.js';
import type { ModelInfo } from './base.js';

const HF_MODELS: ModelInfo[] = [
    { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1（HF）', maxTokens: 163840, pricing: { input: 1.0, output: 3.0 }, provider: 'huggingface' },
    { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3（HF）', maxTokens: 163840, pricing: { input: 0.27, output: 0.27 }, provider: 'huggingface' },
    { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B（HF）', maxTokens: 128000, pricing: { input: 0.5, output: 0.77 }, provider: 'huggingface' },
    { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B（HF）', maxTokens: 131072, pricing: { input: 0.4, output: 0.4 }, provider: 'huggingface' },
    { id: 'NovaSky-Berkeley/Sky-T1-32B-Preview', name: 'Sky-T1 32B', maxTokens: 32768, pricing: { input: 0.5, output: 0.5 }, provider: 'huggingface' },
    { id: 'mistralai/Mistral-7B-Instruct-v0.3', name: 'Mistral 7B v0.3（HF）', maxTokens: 32768, pricing: { input: 0.0, output: 0.0 }, provider: 'huggingface' }, // free tier
];

export class HuggingFaceProvider extends BaseOpenAICompatibleProvider {
    readonly name = 'Hugging Face';

    constructor(apiKey: string) {
        super(apiKey, 'https://router.huggingface.co/v1');
    }

    override async listModels(): Promise<ModelInfo[]> {
        return HF_MODELS;
    }
}
