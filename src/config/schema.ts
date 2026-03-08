/**
 * 配置 Schema 校验 + API Key 管理（OpenClaw 风格）
 *
 * 环境变量命名参考 openclaw 规范：
 *   OPENAI_API_KEY / ANTHROPIC_API_KEY / GEMINI_API_KEY（Google）
 *   ZAI_API_KEY（Z.AI/GLM）/ DEEPSEEK_API_KEY / MOONSHOT_API_KEY / MINIMAX_API_KEY
 *
 * 优先级：process.env > 本地 config.json > 默认值
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { config as loadDotenv } from 'dotenv';
import { DEFAULT_CONFIG } from './default.js';
import type { BuiltinProviderName, ProviderConfig } from '../providers/factory.js';
import type { CustomProviderConfig } from '../providers/custom.js';

// 加载 .env 文件
loadDotenv();

/** Built-in Provider 独立 Key 配置 */
export interface BuiltinKeys {
    openai?: { apiKey: string };
    anthropic?: { apiKey: string };
    google?: { apiKey: string };
    zai?: { apiKey: string };
    deepseek?: { apiKey: string };
    moonshot?: { apiKey: string };
    minimax?: { apiKey: string; groupId?: string };
    /** 旧版兼容 */
    openrouter?: { apiKey: string };
}

export interface AppConfig extends BuiltinKeys, ProviderConfig {
    activeProvider: string;
    /** 自定义 Provider 列表（OpenRouter/Ollama/vLLM/代理等） */
    customProviders?: CustomProviderConfig[];
    defaultModel: string;
    costLimitUsd: number;
    /** 兼容旧版 */
    apiKey?: string;
    baseUrl?: string;
}

const CONFIG_DIR = join(homedir(), '.token-burner');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

function ensureConfigDir(): void {
    if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
}

function loadFileConfig(): Partial<AppConfig> {
    if (!existsSync(CONFIG_FILE)) return {};
    try {
        return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) as Partial<AppConfig>;
    } catch {
        return {};
    }
}

/** 环境变量名映射（OpenClaw 规范） */
const ENV_KEYS: Record<BuiltinProviderName, string> = {
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    google: 'GEMINI_API_KEY',   // openclaw: GEMINI_API_KEY，兼容 GOOGLE_API_KEY
    zai: 'ZAI_API_KEY',
    deepseek: 'DEEPSEEK_API_KEY',
    moonshot: 'MOONSHOT_API_KEY',
    minimax: 'MINIMAX_API_KEY',
};

/**
 * 加载配置（环境变量 > 配置文件 > 默认值）
 */
export function loadConfig(): AppConfig {
    ensureConfigDir();
    const f = loadFileConfig();

    // 从旧 baseUrl 推断 provider（兼容旧版）
    const legacyKey = process.env.OPENAI_API_KEY || f.apiKey;
    const legacyBaseUrl = process.env.OPENAI_BASE_URL || f.baseUrl;

    let inferred: string = f.activeProvider || f.provider || 'openai';
    if (legacyBaseUrl?.includes('openrouter.ai')) inferred = 'openrouter';
    else if (legacyBaseUrl?.includes('moonshot.ai')) inferred = 'moonshot';
    else if (legacyBaseUrl?.includes('bigmodel.cn')) inferred = 'zai';
    else if (legacyBaseUrl?.includes('deepseek.com')) inferred = 'deepseek';

    const config: AppConfig = {
        activeProvider: inferred,
        defaultModel: process.env.DEFAULT_MODEL || f.defaultModel || DEFAULT_CONFIG.api.defaultModel,
        costLimitUsd: process.env.COST_LIMIT_USD
            ? parseFloat(process.env.COST_LIMIT_USD)
            : (f.costLimitUsd ?? DEFAULT_CONFIG.engine.costLimitUsd),
        apiKey: legacyKey,
        baseUrl: legacyBaseUrl,
        customProviders: f.customProviders ?? [],
    };

    // Built-in provider keys（env 优先，兼容旧 openrouter key）
    const builtins: BuiltinProviderName[] = ['openai', 'anthropic', 'google', 'zai', 'deepseek', 'moonshot', 'minimax'];
    for (const p of builtins) {
        const envKey = process.env[ENV_KEYS[p]];
        // Google 额外兼容 GOOGLE_API_KEY
        const envKeyFallback = p === 'google' ? process.env['GOOGLE_API_KEY'] : undefined;
        const fileConf = f[p as keyof BuiltinKeys] as { apiKey?: string } | undefined;
        const key = envKey || envKeyFallback || fileConf?.apiKey;
        if (key) {
            if (p === 'minimax') {
                config[p] = { apiKey: key, groupId: process.env.MINIMAX_GROUP_ID || (f.minimax as { groupId?: string } | undefined)?.groupId };
            } else {
                (config as unknown as Record<string, unknown>)[p] = { apiKey: key };
            }
        }
    }

    // 旧版 openrouter key 迁移
    const orKey = process.env.OPENROUTER_API_KEY || f.openrouter?.apiKey;
    if (orKey) config.openrouter = { apiKey: orKey };

    // 兼容 legacyKey 兜底
    if (legacyKey && inferred === 'openai' && !config.openai) {
        config.openai = { apiKey: legacyKey };
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
    // 深度合并 customProviders（替换同 id 的）
    if (config.customProviders) {
        merged.customProviders = config.customProviders;
    }
    writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf-8');
}

/**
 * 读取配置（async 版本，兼容 OAuth 路由）
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

    // 检查 built-in provider 是否有 key
    const builtinConf = config[p as keyof BuiltinKeys] as { apiKey?: string } | undefined;
    const customConf = config.customProviders?.find(c => c.id === p);
    const hasKey = !!builtinConf?.apiKey || !!customConf?.apiKey || !!config.apiKey;

    if (!hasKey) errors.push(`未配置 ${p} 的 API Key，请在配置页填写`);
    if (config.costLimitUsd <= 0) errors.push('费用上限必须大于 0');

    return { valid: errors.length === 0, errors };
}
