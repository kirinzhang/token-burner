/**
 * API 路由 — 配置管理（多 Provider 版）
 */

import { Router } from 'express';
import { loadConfig, saveConfig, validateApiKey } from '../../config/schema.js';
import type { AppConfig } from '../../config/schema.js';

export const configRouter = Router();

/**
 * GET /api/config — 读取当前配置（API Key 脱敏）
 */
configRouter.get('/', (_req, res) => {
    const config = loadConfig();

    // 对每个 Provider 的 apiKey 脱敏
    const masked: Record<string, unknown> = {
        activeProvider: config.activeProvider,
        defaultModel: config.defaultModel,
        costLimitUsd: config.costLimitUsd,
        apiKeySource: process.env.OPENAI_API_KEY ? 'env' : 'file',
    };

    const providers: Record<string, unknown> = {};
    const providerNames = ['openrouter', 'openai', 'anthropic', 'google', 'minimax', 'glm', 'deepseek'] as const;
    for (const p of providerNames) {
        const pConf = config[p as keyof AppConfig] as { apiKey?: string; groupId?: string } | undefined;
        if (pConf?.apiKey) {
            const k = pConf.apiKey;
            providers[p] = {
                ...pConf,
                apiKey: k.length > 10 ? `${k.slice(0, 6)}...${k.slice(-3)}` : '***',
                configured: true,
            };
        } else {
            providers[p] = { configured: false };
        }
    }
    masked['providers'] = providers;

    res.json(masked);
});

/**
 * POST /api/config — 保存配置
 * body: { activeProvider, openrouter?: { apiKey }, openai?: { apiKey }, ... }
 */
configRouter.post('/', (req, res) => {
    const body = req.body as Partial<AppConfig>;

    // 校验各 Provider 的 apiKey 格式（如提供）
    const providerNames = ['openrouter', 'openai', 'anthropic', 'google', 'minimax', 'glm', 'deepseek'] as const;
    for (const p of providerNames) {
        const pConf = body[p as keyof AppConfig] as { apiKey?: string } | undefined;
        if (pConf?.apiKey && !pConf.apiKey.includes('...')) {
            if (!validateApiKey(pConf.apiKey)) {
                res.status(400).json({ error: `${p} API Key 格式无效` });
                return;
            }
        }
    }

    const current = loadConfig();

    // 合并配置（保留旧 key，只覆盖传入的字段）
    const updated: Partial<AppConfig> = {
        activeProvider: body.activeProvider ?? current.activeProvider,
        defaultModel: body.defaultModel ?? current.defaultModel,
        costLimitUsd: body.costLimitUsd ?? current.costLimitUsd,
    };

    // 合并各 Provider 配置（保留已有 key，脱敏 key 不覆盖原始值）
    for (const p of providerNames) {
        const newConf = body[p as keyof AppConfig] as { apiKey?: string; groupId?: string } | undefined;
        const curConf = current[p as keyof AppConfig] as { apiKey?: string; groupId?: string } | undefined;
        if (newConf) {
            (updated as Record<string, unknown>)[p] = {
                ...curConf,
                ...newConf,
                // 脱敏 key（含 ...）不覆盖原始值
                apiKey: newConf.apiKey?.includes('...')
                    ? (curConf?.apiKey ?? '')
                    : (newConf.apiKey ?? curConf?.apiKey ?? ''),
            };
        }
    }

    saveConfig(updated);
    res.json({ success: true, message: '配置已保存' });
});
