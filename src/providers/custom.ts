/**
 * Custom Provider — 自定义 baseUrl + API Key + 模型列表
 * 兼容 OpenAI 接口的任意第三方服务（OpenRouter / Ollama / vLLM / 本地代理 等）
 */

import { BaseOpenAICompatibleProvider } from './openai.js';
import type { ModelInfo } from './base.js';
import { logger } from '../utils/logger.js';

export interface CustomProviderConfig {
    /** 唯一 ID，用作 provider 前缀，如 "my-proxy" */
    id: string;
    /** 展示名称 */
    name: string;
    /** OpenAI 兼容 Base URL，如 https://openrouter.ai/api/v1 */
    baseUrl: string;
    /** API Key（Ollama 等无需鉴权的服务可留空） */
    apiKey: string;
    /** 可选：手动维护的模型列表 */
    models?: Array<{ id: string; name: string; inputPrice?: number; outputPrice?: number }>;
    /** 是否尝试从 /v1/models 自动拉取模型，默认 true */
    autoFetchModels?: boolean;
}

export class CustomProvider extends BaseOpenAICompatibleProvider {
    readonly name: string;
    private config: CustomProviderConfig;
    private cachedModels: ModelInfo[] | null = null;

    constructor(config: CustomProviderConfig) {
        super(
            config.apiKey || 'none',
            config.baseUrl,
            { 'HTTP-Referer': 'https://github.com/kirinzhang/token-burner' },
        );
        this.name = config.name;
        this.config = config;
    }

    override async listModels(): Promise<ModelInfo[]> {
        if (this.cachedModels) return this.cachedModels;

        // 优先：手动配置的模型列表
        if (this.config.models && this.config.models.length > 0) {
            this.cachedModels = this.config.models.map(m => ({
                id: m.id,
                name: m.name,
                maxTokens: 8192,
                pricing: { input: m.inputPrice ?? 0, output: m.outputPrice ?? 0 },
                provider: this.config.id,
            }));
            return this.cachedModels;
        }

        // 自动从 /v1/models 拉取（如 OpenRouter、Ollama）
        if (this.config.autoFetchModels !== false) {
            try {
                const res = await fetch(`${this.config.baseUrl.replace(/\/$/, '')}/models`, {
                    headers: this.config.apiKey
                        ? { Authorization: `Bearer ${this.config.apiKey}` }
                        : {},
                });
                if (res.ok) {
                    const json = await res.json() as {
                        data: Array<{
                            id: string;
                            name?: string;
                            context_length?: number;
                            pricing?: { prompt: string; completion: string };
                        }>
                    };
                    this.cachedModels = json.data.map(m => ({
                        id: m.id,
                        name: m.name ?? m.id,
                        maxTokens: Math.min(m.context_length ?? 8192, 32768),
                        pricing: {
                            input: m.pricing ? parseFloat(m.pricing.prompt) * 1_000_000 : 0,
                            output: m.pricing ? parseFloat(m.pricing.completion) * 1_000_000 : 0,
                        },
                        provider: this.config.id,
                    }));
                    logger.info(`[Custom:${this.config.id}] 拉取到 ${this.cachedModels.length} 个模型`);
                    return this.cachedModels;
                }
            } catch (err) {
                logger.warn(`[Custom:${this.config.id}] 自动拉取模型失败: ${(err as Error).message}`);
            }
        }

        return [];
    }

    override async testConnection(): Promise<boolean> {
        try {
            const res = await fetch(`${this.config.baseUrl.replace(/\/$/, '')}/models`, {
                headers: this.config.apiKey
                    ? { Authorization: `Bearer ${this.config.apiKey}` }
                    : {},
            });
            return res.ok;
        } catch {
            return false;
        }
    }
}
