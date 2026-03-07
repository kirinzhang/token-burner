/**
 * OpenRouter Provider
 * 统一中转层 — 一个 API Key 访问 800+ 模型 / 40+ 供应商
 * 支持 OAuth PKCE 授权或手动填写 API Key
 */

import { BaseOpenAICompatibleProvider } from './openai.js';
import type { ModelInfo, PromptPayload, ConsumeResult } from './base.js';
import { logger } from '../utils/logger.js';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/** 静态兜底模型列表（当 API 不可用时使用） */
const STATIC_MODELS: ModelInfo[] = [
    // ── OpenAI ──────────────────────────────────────────────────────────
    { id: 'openai/gpt-4o', name: 'GPT-4o', maxTokens: 16384, pricing: { input: 2.50, output: 10.00 }, provider: 'OpenAI' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', maxTokens: 16384, pricing: { input: 0.15, output: 0.60 }, provider: 'OpenAI' },
    { id: 'openai/gpt-4.5-preview', name: 'GPT-4.5 Preview', maxTokens: 16384, pricing: { input: 75.00, output: 150.00 }, provider: 'OpenAI' },
    { id: 'openai/o1', name: 'o1', maxTokens: 32768, pricing: { input: 15.00, output: 60.00 }, provider: 'OpenAI' },
    { id: 'openai/o3-mini', name: 'o3-mini', maxTokens: 100000, pricing: { input: 1.10, output: 4.40 }, provider: 'OpenAI' },
    // ── Anthropic ───────────────────────────────────────────────────────
    { id: 'anthropic/claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', maxTokens: 8096, pricing: { input: 3.00, output: 15.00 }, provider: 'Anthropic' },
    { id: 'anthropic/claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', maxTokens: 8096, pricing: { input: 3.00, output: 15.00 }, provider: 'Anthropic' },
    { id: 'anthropic/claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', maxTokens: 8096, pricing: { input: 0.80, output: 4.00 }, provider: 'Anthropic' },
    { id: 'anthropic/claude-3-opus-20240229', name: 'Claude 3 Opus', maxTokens: 4096, pricing: { input: 15.00, output: 75.00 }, provider: 'Anthropic' },
    // ── Google ──────────────────────────────────────────────────────────
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', maxTokens: 8192, pricing: { input: 0.10, output: 0.40 }, provider: 'Google' },
    { id: 'google/gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro Exp', maxTokens: 8192, pricing: { input: 0.00, output: 0.00 }, provider: 'Google' },
    { id: 'google/gemini-1.5-pro', name: 'Gemini 1.5 Pro', maxTokens: 8192, pricing: { input: 1.25, output: 5.00 }, provider: 'Google' },
    // ── Meta Llama ──────────────────────────────────────────────────────
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', maxTokens: 8192, pricing: { input: 0.12, output: 0.30 }, provider: 'Meta' },
    { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', maxTokens: 8192, pricing: { input: 2.70, output: 2.70 }, provider: 'Meta' },
    // ── DeepSeek ────────────────────────────────────────────────────────
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', maxTokens: 8192, pricing: { input: 0.55, output: 2.19 }, provider: 'DeepSeek' },
    { id: 'deepseek/deepseek-v3', name: 'DeepSeek V3', maxTokens: 8192, pricing: { input: 0.27, output: 1.10 }, provider: 'DeepSeek' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', maxTokens: 8192, pricing: { input: 0.14, output: 0.28 }, provider: 'DeepSeek' },
    // ── Qwen / Alibaba ──────────────────────────────────────────────────
    { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', maxTokens: 8192, pricing: { input: 0.35, output: 0.40 }, provider: 'Alibaba' },
    { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder 32B', maxTokens: 8192, pricing: { input: 0.18, output: 0.18 }, provider: 'Alibaba' },
    // ── Mistral ─────────────────────────────────────────────────────────
    { id: 'mistralai/mistral-large-2411', name: 'Mistral Large', maxTokens: 8192, pricing: { input: 2.00, output: 6.00 }, provider: 'Mistral' },
    { id: 'mistralai/mistral-small-2409', name: 'Mistral Small', maxTokens: 8192, pricing: { input: 0.20, output: 0.60 }, provider: 'Mistral' },
    // ── xAI ─────────────────────────────────────────────────────────────
    { id: 'x-ai/grok-2-1212', name: 'Grok 2', maxTokens: 8192, pricing: { input: 2.00, output: 10.00 }, provider: 'xAI' },
    { id: 'x-ai/grok-beta', name: 'Grok Beta', maxTokens: 8192, pricing: { input: 5.00, output: 15.00 }, provider: 'xAI' },
    // ── MiniMax ─────────────────────────────────────────────────────────
    { id: 'minimax/minimax-01', name: 'MiniMax-01', maxTokens: 8192, pricing: { input: 0.20, output: 1.10 }, provider: 'MiniMax' },
    // ── Moonshot ────────────────────────────────────────────────────────
    { id: 'moonshot/moonshot-v1-8k', name: 'Moonshot v1 8K', maxTokens: 8192, pricing: { input: 0.20, output: 0.20 }, provider: 'Moonshot' },
];

/** 模型列表缓存（内存，TTL 10 分钟） */
let modelCache: { data: ModelInfo[]; expireAt: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

export class OpenRouterProvider extends BaseOpenAICompatibleProvider {
    readonly name = 'OpenRouter';
    private apiKey: string;

    constructor(apiKey: string) {
        super(apiKey, OPENROUTER_BASE_URL, {
            'HTTP-Referer': 'https://github.com/kirinzhang/token-burner',
            'X-Title': 'Token Burner',
        });
        this.apiKey = apiKey;
    }

    /** 从 OpenRouter API 动态拉取完整模型列表 */
    override async listModels(): Promise<ModelInfo[]> {
        // 检查缓存
        if (modelCache && Date.now() < modelCache.expireAt) {
            return modelCache.data;
        }

        try {
            const res = await fetch(`${OPENROUTER_BASE_URL}/models`, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'HTTP-Referer': 'https://github.com/kirinzhang/token-burner',
                },
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = await res.json() as {
                data: Array<{
                    id: string;
                    name: string;
                    context_length: number;
                    pricing: { prompt: string; completion: string };
                    architecture?: { modality?: string };
                }>
            };

            const models: ModelInfo[] = json.data
                .filter(m => m.architecture?.modality !== 'image') // 过滤图像生成模型
                .map(m => ({
                    id: m.id,
                    name: m.name,
                    maxTokens: Math.min(m.context_length, 16384),
                    pricing: {
                        input: parseFloat(m.pricing.prompt) * 1_000_000,
                        output: parseFloat(m.pricing.completion) * 1_000_000,
                    },
                    provider: m.id.split('/')[0] ?? 'unknown',
                }))
                .filter(m => !isNaN(m.pricing.input));

            modelCache = { data: models, expireAt: Date.now() + CACHE_TTL_MS };
            logger.info(`[OpenRouter] 已动态拉取 ${models.length} 个模型`);
            return models;
        } catch (err) {
            logger.warn(`[OpenRouter] 动态拉取模型失败，使用静态列表: ${(err as Error).message}`);
            return STATIC_MODELS;
        }
    }

    /** 连接测试 */
    override async testConnection(): Promise<boolean> {
        try {
            const res = await fetch(`${OPENROUTER_BASE_URL}/auth/key`, {
                headers: { Authorization: `Bearer ${this.apiKey}` },
            });
            return res.ok;
        } catch {
            return false;
        }
    }

    override async sendMessage(payload: PromptPayload): Promise<ConsumeResult> {
        return super.sendMessage(payload);
    }
}
