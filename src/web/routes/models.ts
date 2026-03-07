/**
 * API 路由 — 模型列表（按厂商分组）
 */

import { Router } from 'express';
import { MODEL_PRICING } from '../../config/default.js';

export const modelsRouter = Router();

/**
 * GET /api/models — 返回按厂商分组的可用模型和价格
 */
modelsRouter.get('/', (_req, res) => {
    const models = Object.entries(MODEL_PRICING).map(([id, pricing]) => ({
        id,
        name: formatModelName(id),
        provider: pricing.provider,
        pricing: { input: pricing.input, output: pricing.output },
        priceDesc: `$${pricing.input}/$${pricing.output} per 1M`,
    }));
    res.json(models);
});

function formatModelName(id: string): string {
    const names: Record<string, string> = {
        'gpt-4o': 'GPT-4o',
        'gpt-4o-mini': 'GPT-4o Mini',
        'gpt-4-turbo': 'GPT-4 Turbo',
        'gpt-3.5-turbo': 'GPT-3.5 Turbo',
        'o1': 'o1',
        'o1-mini': 'o1 Mini',
        'o3-mini': 'o3-mini',
        'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
        'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
        'claude-3-opus-20240229': 'Claude 3 Opus',
        'claude-3-haiku-20240307': 'Claude 3 Haiku',
        'gemini-2.0-flash': 'Gemini 2.0 Flash',
        'gemini-2.0-flash-lite': 'Gemini 2.0 Flash Lite',
        'gemini-1.5-pro': 'Gemini 1.5 Pro',
        'gemini-1.5-flash': 'Gemini 1.5 Flash',
        'gemini-1.5-flash-8b': 'Gemini 1.5 Flash 8B',
        'meta-llama/llama-3.3-70b-instruct': 'Llama 3.3 70B',
        'meta-llama/llama-3.1-8b-instruct': 'Llama 3.1 8B',
        'meta-llama/llama-3.1-70b-instruct': 'Llama 3.1 70B',
        'meta-llama/llama-3.1-405b-instruct': 'Llama 3.1 405B',
        'mistralai/mistral-large-2411': 'Mistral Large',
        'mistralai/mistral-small-2409': 'Mistral Small',
        'mistralai/mistral-nemo': 'Mistral Nemo',
        'mistralai/codestral-2501': 'Codestral',
        'deepseek/deepseek-r1': 'DeepSeek R1',
        'deepseek/deepseek-v3': 'DeepSeek V3',
        'deepseek/deepseek-r1-distill-llama-70b': 'DeepSeek R1 Distill 70B',
        'deepseek/deepseek-chat': 'DeepSeek Chat',
        'qwen/qwen-2.5-72b-instruct': 'Qwen 2.5 72B',
        'qwen/qwen-2.5-coder-32b-instruct': 'Qwen 2.5 Coder 32B',
        'qwen/qvq-72b-preview': 'QvQ 72B',
        'cohere/command-r-plus-08-2024': 'Command R+',
        'cohere/command-r-08-2024': 'Command R',
    };
    return names[id] ?? id;
}
