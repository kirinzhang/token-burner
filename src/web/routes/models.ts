/**
 * API 路由 — 模型列表（provider/model 格式）
 * 直接从 all-models-data.ts 读取静态数据，零网络请求，瞬时返回。
 * 前端下拉始终显示全部 15 个 Provider 的所有模型。
 */

import { Router } from 'express';
import { loadConfig } from '../../config/schema.js';
import { ProviderFactory } from '../../providers/factory.js';
import { ALL_MODELS } from '../../providers/all-models-data.js';

export const modelsRouter = Router();

modelsRouter.get('/', async (_req, res) => {
    try {
        const config = loadConfig();

        // ── 1. 所有 built-in providers 静态模型（零网络请求，瞬时返回）────────────
        const seen = new Set<string>(ALL_MODELS.map(m => m.id));
        const allModels = ALL_MODELS.map(m => ({
            id: m.id,
            name: m.name,
            provider: m.provider,
            pricing: { input: m.input, output: m.output },
            priceDesc: `$${m.input}/$${m.output} per 1M`,
        }));

        // ── 2. Custom providers 模型（仅已配置的，动态拉取）──────────────────────
        for (const cp of config.customProviders ?? []) {
            if (!cp.apiKey && !cp.baseUrl) continue;
            try {
                const p = ProviderFactory.create({ ...config, activeProvider: cp.id });
                const ms = await p.listModels();
                for (const m of ms) {
                    const pid = m.provider ?? cp.id;
                    const modelId = m.id.includes('/') ? m.id : `${pid}/${m.id}`;
                    if (!seen.has(modelId)) {
                        seen.add(modelId);
                        allModels.push({
                            id: modelId,
                            name: m.name,
                            provider: pid,
                            pricing: { input: m.pricing.input, output: m.pricing.output },
                            priceDesc: `$${m.pricing.input}/$${m.pricing.output} per 1M`,
                        });
                    }
                }
            } catch {
                // 忽略
            }
        }

        res.json(allModels);
    } catch {
        res.json([]);
    }
});
