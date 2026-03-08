/**
 * API 路由 — 配置管理（多 Provider + Custom Providers 版）
 */

import { Router } from 'express';
import { loadConfig, saveConfig, validateApiKey } from '../../config/schema.js';
import type { AppConfig, BuiltinKeys } from '../../config/schema.js';
import { BUILTIN_PROVIDER_META } from '../../providers/factory.js';

export const configRouter = Router();

const BUILTIN_IDS = Object.keys(BUILTIN_PROVIDER_META) as Array<keyof BuiltinKeys>;

/**
 * GET /api/config — 读取当前配置（API Key 脱敏）
 */
configRouter.get('/', (_req, res) => {
    const config = loadConfig();

    // Built-in providers 状态
    const providers: Record<string, unknown> = {};
    for (const p of BUILTIN_IDS) {
        const pConf = config[p] as { apiKey?: string; groupId?: string } | undefined;
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

    res.json({
        activeProvider: config.activeProvider,
        defaultModel: config.defaultModel,
        costLimitUsd: config.costLimitUsd,
        providers,
        customProviders: (config.customProviders ?? []).map(cp => ({
            ...cp,
            // API Key 脱敏
            apiKey: cp.apiKey && cp.apiKey.length > 8
                ? `${cp.apiKey.slice(0, 5)}...${cp.apiKey.slice(-3)}`
                : (cp.apiKey ? '***' : ''),
        })),
    });
});

/**
 * POST /api/config — 保存配置
 */
configRouter.post('/', (req, res) => {
    const body = req.body as Partial<AppConfig>;
    const current = loadConfig();

    const updated: Partial<AppConfig> = {
        activeProvider: body.activeProvider ?? current.activeProvider,
        defaultModel: body.defaultModel ?? current.defaultModel,
        costLimitUsd: body.costLimitUsd ?? current.costLimitUsd,
    };

    // 合并 built-in provider keys
    for (const p of BUILTIN_IDS) {
        const newConf = body[p] as { apiKey?: string; groupId?: string } | undefined;
        const curConf = current[p] as { apiKey?: string; groupId?: string } | undefined;
        if (newConf) {
            const apiKey = newConf.apiKey?.includes('...')
                ? (curConf?.apiKey ?? '')  // 脱敏 key 不覆盖原始值
                : (newConf.apiKey ?? curConf?.apiKey ?? '');
            if (apiKey && !validateApiKey(apiKey) && !newConf.apiKey?.includes('...')) {
                res.status(400).json({ error: `${p} API Key 格式无效` });
                return;
            }
            (updated as Record<string, unknown>)[p] = { ...curConf, ...newConf, apiKey };
        }
    }

    // 合并 customProviders（完整替换）
    if (body.customProviders !== undefined) {
        updated.customProviders = body.customProviders;
    }

    saveConfig(updated);
    res.json({ success: true, message: '配置已保存' });
});

/**
 * POST /api/config/custom-provider — 添加或更新 custom provider
 */
configRouter.post('/custom-provider', (req, res) => {
    const body = req.body as {
        id: string; name: string; baseUrl: string; apiKey: string;
        models?: Array<{ id: string; name: string; inputPrice?: number; outputPrice?: number }>;
        autoFetchModels?: boolean;
    };

    if (!body.id || !body.baseUrl) {
        res.status(400).json({ error: '缺少 id 或 baseUrl' });
        return;
    }

    const config = loadConfig();
    const existing = config.customProviders ?? [];
    const idx = existing.findIndex(cp => cp.id === body.id);
    if (idx >= 0) {
        existing[idx] = { ...existing[idx], ...body };
    } else {
        existing.push(body);
    }
    saveConfig({ customProviders: existing });
    res.json({ success: true });
});

/**
 * DELETE /api/config/custom-provider/:id — 删除 custom provider
 */
configRouter.delete('/custom-provider/:id', (req, res) => {
    const { id } = req.params;
    const config = loadConfig();
    const filtered = (config.customProviders ?? []).filter(cp => cp.id !== id);
    saveConfig({ customProviders: filtered });
    res.json({ success: true });
});
