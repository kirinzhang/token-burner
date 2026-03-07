/**
 * 默认配置常量
 * 控制 Token Burner 的全局行为参数
 */

export const DEFAULT_CONFIG = {
    // API 配置
    api: {
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-4o-mini',
        maxRetries: 3,
        retryDelayMs: 1000,
    },

    // 速率限制
    rateLimit: {
        maxRequestsPerMinute: 20,
        maxTokensPerMinute: 100_000,
    },

    // 消耗引擎
    engine: {
        defaultTarget: 10_000,
        /** 最大允许消耗 Token 数（10M） */
        maxTokenTarget: 10_000_000,
        costLimitUsd: 10,
        checkpointIntervalMs: 30_000,
    },

    // 伪装引擎
    camouflage: {
        workingHoursStart: 9,
        workingHoursEnd: 18,
        minDelayMs: 30_000,
        maxDelayMs: 300_000,
        topicSwitchAfterRounds: { min: 3, max: 8 },
    },

    // 存储
    storage: {
        dbPath: '.token-burner/data.db',
    },

    // 配置文件路径
    configFilePath: '.token-burner/config.json',
} as const;

/**
 * 模型价格信息（每 1M Token，单位 USD）
 * 数据来源：OpenRouter / 各官方定价页（2025-03）
 */
export const MODEL_PRICING: Record<string, { input: number; output: number; provider: string }> = {
    // ── OpenAI ──────────────────────────────────────────
    'gpt-4o': { input: 2.50, output: 10.00, provider: 'OpenAI' },
    'gpt-4o-mini': { input: 0.15, output: 0.60, provider: 'OpenAI' },
    'gpt-4-turbo': { input: 10.00, output: 30.00, provider: 'OpenAI' },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50, provider: 'OpenAI' },
    'o1': { input: 15.00, output: 60.00, provider: 'OpenAI' },
    'o1-mini': { input: 3.00, output: 12.00, provider: 'OpenAI' },
    'o3-mini': { input: 1.10, output: 4.40, provider: 'OpenAI' },

    // ── Anthropic Claude ─────────────────────────────────
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00, provider: 'Anthropic' },
    'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00, provider: 'Anthropic' },
    'claude-3-opus-20240229': { input: 15.00, output: 75.00, provider: 'Anthropic' },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25, provider: 'Anthropic' },

    // ── Google Gemini ─────────────────────────────────────
    'gemini-2.0-flash': { input: 0.10, output: 0.40, provider: 'Google' },
    'gemini-2.0-flash-lite': { input: 0.075, output: 0.30, provider: 'Google' },
    'gemini-1.5-pro': { input: 1.25, output: 5.00, provider: 'Google' },
    'gemini-1.5-flash': { input: 0.075, output: 0.30, provider: 'Google' },
    'gemini-1.5-flash-8b': { input: 0.0375, output: 0.15, provider: 'Google' },

    // ── Meta Llama (via OpenRouter) ───────────────────────
    'meta-llama/llama-3.3-70b-instruct': { input: 0.12, output: 0.30, provider: 'Meta' },
    'meta-llama/llama-3.1-8b-instruct': { input: 0.055, output: 0.055, provider: 'Meta' },
    'meta-llama/llama-3.1-70b-instruct': { input: 0.12, output: 0.30, provider: 'Meta' },
    'meta-llama/llama-3.1-405b-instruct': { input: 2.70, output: 2.70, provider: 'Meta' },

    // ── Mistral ───────────────────────────────────────────
    'mistralai/mistral-large-2411': { input: 2.00, output: 6.00, provider: 'Mistral' },
    'mistralai/mistral-small-2409': { input: 0.20, output: 0.60, provider: 'Mistral' },
    'mistralai/mistral-nemo': { input: 0.13, output: 0.13, provider: 'Mistral' },
    'mistralai/codestral-2501': { input: 0.30, output: 0.90, provider: 'Mistral' },

    // ── DeepSeek ──────────────────────────────────────────
    'deepseek/deepseek-r1': { input: 0.55, output: 2.19, provider: 'DeepSeek' },
    'deepseek/deepseek-v3': { input: 0.27, output: 1.10, provider: 'DeepSeek' },
    'deepseek/deepseek-r1-distill-llama-70b': { input: 0.23, output: 0.69, provider: 'DeepSeek' },
    'deepseek/deepseek-chat': { input: 0.14, output: 0.28, provider: 'DeepSeek' },

    // ── Qwen (Alibaba) ────────────────────────────────────
    'qwen/qwen-2.5-72b-instruct': { input: 0.35, output: 0.40, provider: 'Qwen' },
    'qwen/qwen-2.5-coder-32b-instruct': { input: 0.18, output: 0.18, provider: 'Qwen' },
    'qwen/qvq-72b-preview': { input: 0.50, output: 1.50, provider: 'Qwen' },

    // ── Cohere ────────────────────────────────────────────
    'cohere/command-r-plus-08-2024': { input: 2.50, output: 10.00, provider: 'Cohere' },
    'cohere/command-r-08-2024': { input: 0.15, output: 0.60, provider: 'Cohere' },
};
