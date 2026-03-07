/**
 * 配置 Schema 校验 + API Key 管理
 * 优先级：.env 环境变量 > 本地 config.json > 默认值
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { config as loadDotenv } from 'dotenv';
import { DEFAULT_CONFIG } from './default.js';

// 加载 .env 文件（项目根目录）
loadDotenv();

export interface AppConfig {
    provider: string;
    apiKey: string;
    baseUrl: string;
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

/**
 * 从本地文件读取已保存配置（不含 env 覆盖）
 */
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
 * 加载用户配置
 * 优先级：process.env（来自 .env 文件）> 本地 config.json > 默认值
 */
export function loadConfig(): AppConfig {
    ensureConfigDir();
    const fileConf = loadFileConfig();

    return {
        provider: 'openai',
        // .env 中的 OPENAI_API_KEY 优先
        apiKey: process.env.OPENAI_API_KEY || fileConf.apiKey || '',
        baseUrl: process.env.OPENAI_BASE_URL || fileConf.baseUrl || DEFAULT_CONFIG.api.baseUrl,
        defaultModel: process.env.DEFAULT_MODEL || fileConf.defaultModel || DEFAULT_CONFIG.api.defaultModel,
        costLimitUsd: process.env.COST_LIMIT_USD
            ? parseFloat(process.env.COST_LIMIT_USD)
            : (fileConf.costLimitUsd ?? DEFAULT_CONFIG.engine.costLimitUsd),
    };
}

/**
 * 保存配置到本地文件（不覆盖 .env）
 */
export function saveConfig(config: AppConfig): void {
    ensureConfigDir();
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * 校验 API Key 格式
 */
export function validateApiKey(key: string): boolean {
    if (!key || key.trim().length === 0) return false;
    if (key.startsWith('sk-') && key.length > 20) return true;
    return key.length > 10;
}

/**
 * 校验配置完整性
 */
export function validateConfig(config: AppConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.apiKey) {
        errors.push('未配置 API Key，请在 .env 文件设置 OPENAI_API_KEY 或运行 `token-burner config set-key`');
    }

    if (config.costLimitUsd <= 0) {
        errors.push('费用上限必须大于 0');
    }

    return { valid: errors.length === 0, errors };
}
