/**
 * 模型选择器 — 交互式模型选择
 */

import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import type { AIProvider, ModelInfo } from '../providers/base.js';
import { formatCost } from '../utils/cost-calculator.js';

/**
 * 交互式选择模型
 */
export async function selectModel(provider: AIProvider): Promise<ModelInfo> {
    const models = await provider.listModels();

    const modelId = await select({
        message: '🤖 选择模型:',
        choices: models.map(m => ({
            name: formatModelChoice(m),
            value: m.id,
        })),
    });

    return models.find(m => m.id === modelId)!;
}

/**
 * 格式化模型选项显示
 */
function formatModelChoice(model: ModelInfo): string {
    const inputPrice = formatCost(model.pricing.input);
    const outputPrice = formatCost(model.pricing.output);
    const paddedName = model.name.padEnd(16);
    return `${paddedName} ${chalk.gray(`输入 ${inputPrice}/1M · 输出 ${outputPrice}/1M`)}`;
}

/**
 * 根据模型 ID 获取模型信息
 */
export async function getModelById(
    provider: AIProvider,
    modelId: string
): Promise<ModelInfo | undefined> {
    const models = await provider.listModels();
    return models.find(m => m.id === modelId);
}
