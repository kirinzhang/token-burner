/**
 * API 路由 — 模型列表（provider/model 格式）
 * 返回 {id: "openai/gpt-4o", name: "GPT-4o", provider: "openai", ...} 格式
 */

import { Router } from 'express';
import { loadConfig } from '../../config/schema.js';
import { ProviderFactory, BUILTIN_PROVIDER_META } from '../../providers/factory.js';

export const modelsRouter = Router();

/**
 * GET /api/models — 返回按 provider 分组的完整模型列表（含 custom providers）
 */
modelsRouter.get('/', async (_req, res) => {
    try {
        const config = loadConfig();
        const allModels: Array<{
            id: string;
            name: string;
            provider: string;
            pricing: { input: number; output: number };
            priceDesc: string;
        }> = [];

        // 1. 当前激活的 provider 先拉（如果 OpenRouter this can be 800+ models）
        try {
            const activeProvider = ProviderFactory.create(config);
            const activeModels = await activeProvider.listModels();
            for (const m of activeModels) {
                // 格式化为 provider/model
                const providerPrefix = m.provider ?? config.activeProvider;
                const modelId = m.id.includes('/') ? m.id : `${providerPrefix}/${m.id}`;
                allModels.push({
                    id: modelId,
                    name: m.name,
                    provider: providerPrefix,
                    pricing: { input: m.pricing.input, output: m.pricing.output },
                    priceDesc: `$${m.pricing.input}/$${m.pricing.output} per 1M`,
                });
            }
        } catch (e) {
            // 激活 provider 无 key 时忽略
        }

        // 2. 其他 built-in providers 的静态模型列表也加进来（已配置 key 的）
        const builtins = ProviderFactory.builtinIds();
        for (const bid of builtins) {
            if (bid === (config.activeProvider as string)) continue; // 已处理
            const key = (config[bid as keyof typeof config] as { apiKey?: string } | undefined)?.apiKey;
            if (!key) continue; // 没 key 的不拉
            try {
                const p = ProviderFactory.create({ ...config, activeProvider: bid });
                const ms = await p.listModels();
                for (const m of ms) {
                    const modelId = m.id.includes('/') ? m.id : `${bid}/${m.id}`;
                    if (!allModels.find(x => x.id === modelId)) {
                        allModels.push({
                            id: modelId,
                            name: m.name,
                            provider: bid,
                            pricing: { input: m.pricing.input, output: m.pricing.output },
                            priceDesc: `$${m.pricing.input}/$${m.pricing.output} per 1M`,
                        });
                    }
                }
            } catch {
                // 忽略
            }
        }

        // 3. Custom providers 的模型
        for (const cp of config.customProviders ?? []) {
            if (cp.id === config.activeProvider) continue; // 已处理
            try {
                const p = ProviderFactory.create({ ...config, activeProvider: cp.id });
                const ms = await p.listModels();
                for (const m of ms) {
                    const modelId = m.id.includes('/') ? m.id : `${cp.id}/${m.id}`;
                    if (!allModels.find(x => x.id === modelId)) {
                        allModels.push({
                            id: modelId,
                            name: m.name,
                            provider: cp.id,
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
    } catch (err) {
        // 完全失败时返回空
        res.json([]);
    }
});
