/**
 * API 路由 — 模型列表
 * 当 activeProvider 为 openrouter 时从 API 动态拉取并按 provider 分组
 * 否则返回对应直连 Provider 的静态模型列表
 */

import { Router } from 'express';
import { loadConfig } from '../../config/schema.js';
import { ProviderFactory } from '../../providers/factory.js';

export const modelsRouter = Router();

/**
 * GET /api/models — 返回按厂商分组的可用模型和价格
 */
modelsRouter.get('/', async (_req, res) => {
    try {
        const config = loadConfig();
        const provider = ProviderFactory.create(config);
        const models = await provider.listModels();

        const formatted = models.map(m => ({
            id: m.id,
            name: m.name,
            provider: m.provider ?? config.activeProvider ?? 'unknown',
            pricing: { input: m.pricing.input, output: m.pricing.output },
            priceDesc: `$${m.pricing.input}/$${m.pricing.output} per 1M`,
        }));

        res.json(formatted);
    } catch (err) {
        // 配置不完整时返回空列表，不报错
        res.json([]);
    }
});
