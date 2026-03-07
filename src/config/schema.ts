/**
 * 配置 Schema 校验 + API Key 管理
 * 支持多 Provider 独立 Key 配置
 * 优先级：.env 环境变量 > 本地 config.json > 默认值
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { config as loadDotenv } from 'dotenv';
import { DEFAULT_CONFIG } from './default.js';
import type { ProviderName } from '../providers/factory.js';

// 加载 .env 文件（项目根目录）
loadDotenv();

/** 每个 Provider 的独立 Key 配置 */
export interface ProviderKeys {
    openrouter?: { apiKey: string };
    openai?: { apiKey: string };
    anthropic?: { apiKey: string };
    google?: { apiKey: string };
    minimax?: { apiKey: string; groupId?: string };
    glm?: { apiKey: string };
    deepseek?: { apiKey: string };
}

export interface AppConfig extends ProviderKeys {
    /** 当前激活的 Provider */
    activeProvider: ProviderName;
    /** 兼容旧版单 key 字段 */
    apiKey?: string;
    baseUrl?: string;
    /** @deprecated 请使用 activeProvider */
    provider?: string;
    defaultModel: string;
    costLimitUsd: number;
}

const CONFIG_DIR = join(homedir(), '.token-burner');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

function ensureConfigDir(): void {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
    }
}

function loadFileConfig(): Partial<AppConfig> {
    if (!existsSync(CONFIG_FILE)) return {};
    try {
        const raw = readFileSync(CONFIG_FILE, 'utf-8');
        return JSON.parse(raw) as Partial<AppConfig>;
    } catch {
        return {};
    }
}

/**
 * 加载配置（环境变量 > 配置文件 > 默认值）
 */
export function loadConfig(): AppConfig {
    ensureConfigDir();
    const f = loadFileConfig();

    // 兼容旧版：如果文件中只有 apiKey 字段，迁移到对应 provider key
    const legacyKey = process.env.OPENAI_API_KEY || f.apiKey;
    const legacyBaseUrl = process.env.OPENAI_BASE_URL || f.baseUrl;

    // 从 base URL 推断 provider（旧版兼容）
    let inferred: ProviderName = 'openai';
    if (legacyBaseUrl?.includes('openrouter.ai')) inferred = 'openrouter';
    else if (legacyBaseUrl?.includes('anthropic.com')) inferred = 'anthropic';
    else if (legacyBaseUrl?.includes('minimax.chat')) inferred = 'minimax';
    else if (legacyBaseUrl?.includes('bigmodel.cn')) inferred = 'glm';
    else if (legacyBaseUrl?.includes('deepseek.com')) inferred = 'deepseek';

    const activeProvider: ProviderName = f.activeProvider ?? inferred;

    const config: AppConfig = {
        activeProvider,
        defaultModel: process.env.DEFAULT_MODEL || f.defaultModel || DEFAULT_CONFIG.api.defaultModel,
        costLimitUsd: process.env.COST_LIMIT_USD
            ? parseFloat(process.env.COST_LIMIT_USD)
            : (f.costLimitUsd ?? DEFAULT_CONFIG.engine.costLimitUsd),
        // 旧版兼容字段
        apiKey: legacyKey,
        baseUrl: legacyBaseUrl,
    };

    // 合并各 provider 独立 Key
    if (f.openrouter || process.env.OPENROUTER_API_KEY) {
        config.openrouter = { apiKey: process.env.OPENROUTER_API_KEY || f.openrouter?.apiKey || '' };
    }
    if (f.openai || process.env.OPENAI_API_KEY) {
        config.openai = { apiKey: process.env.OPENAI_API_KEY || f.openai?.apiKey || '' };
    }
    if (f.anthropic || process.env.ANTHROPIC_API_KEY) {
        config.anthropic = { apiKey: process.env.ANTHROPIC_API_KEY || f.anthropic?.apiKey || '' };
    }
    if (f.google || process.env.GOOGLE_API_KEY) {
        config.google = { apiKey: process.env.GOOGLE_API_KEY || f.google?.apiKey || '' };
    }
    if (f.minimax || process.env.MINIMAX_API_KEY) {
        config.minimax = {
            apiKey: process.env.MINIMAX_API_KEY || f.minimax?.apiKey || '',
            groupId: process.env.MINIMAX_GROUP_ID || f.minimax?.groupId,
        };
    }
    if (f.glm || process.env.GLM_API_KEY) {
        config.glm = { apiKey: process.env.GLM_API_KEY || f.glm?.apiKey || '' };
    }
    if (f.deepseek || process.env.DEEPSEEK_API_KEY) {
        config.deepseek = { apiKey: process.env.DEEPSEEK_API_KEY || f.deepseek?.apiKey || '' };
    }

    // 兜底：如果 activeProvider 对应的 key 还没设置，用 legacyKey 补上
    if (legacyKey && !config[activeProvider as keyof ProviderKeys]) {
        (config as unknown as Record<string, unknown>)[activeProvider] = { apiKey: legacyKey };
    }

    return config;
}

/**
 * 保存配置到本地文件（不覆盖 .env）
 */
export function saveConfig(config: Partial<AppConfig>): void {
    ensureConfigDir();
    const current = loadFileConfig();
    const merged = { ...current, ...config };
    writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf-8');
}

/**
 * 读取 + 保存（用于局部更新）
 */
export async function getConfig(): Promise<AppConfig> {
    return loadConfig();
}

/**
 * 校验 API Key 格式（宽松校验，兼容各厂商格式）
 */
export function validateApiKey(key: string): boolean {
    if (!key || key.trim().length === 0) return false;
    return key.trim().length > 8;
}

/**
 * 校验配置完整性
 */
export function validateConfig(config: AppConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const p = config.activeProvider;
    const hasKey = !!(config[p as keyof ProviderKeys] as { apiKey?: string } | undefined)?.apiKey
        || !!config.apiKey;

    if (!hasKey) {
        errors.push(`未配置 ${p} 的 API Key，请在配置页填写`);
    }
    if (config.costLimitUsd <= 0) {
        errors.push('费用上限必须大于 0');
    }
    return { valid: errors.length === 0, errors };
}
