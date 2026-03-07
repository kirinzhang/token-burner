/**
 * API 路由 — 配置管理
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
    res.json({
        ...config,
        apiKey: config.apiKey
            ? `${config.apiKey.slice(0, 7)}...${config.apiKey.slice(-4)}`
            : '',
        apiKeyConfigured: !!config.apiKey,
        // 标记 API Key 来源
        apiKeySource: process.env.OPENAI_API_KEY ? 'env' : 'file',
    });
});

/**
 * POST /api/config — 保存配置
 */
configRouter.post('/', (req, res) => {
    const body = req.body as Partial<AppConfig> & { apiKey?: string };

    if (body.apiKey && !validateApiKey(body.apiKey)) {
        res.status(400).json({ error: '无效的 API Key 格式' });
        return;
    }

    const current = loadConfig();
    const updated: AppConfig = {
        provider: body.provider ?? current.provider,
        // 如果传入的是脱敏的 key（含 ...），保留原始值
        apiKey: body.apiKey && !body.apiKey.includes('...')
            ? body.apiKey
            : current.apiKey,
        baseUrl: body.baseUrl ?? current.baseUrl,
        defaultModel: body.defaultModel ?? current.defaultModel,
        costLimitUsd: body.costLimitUsd ?? current.costLimitUsd,
    };

    saveConfig(updated);
    res.json({ success: true, message: '配置已保存' });
});
