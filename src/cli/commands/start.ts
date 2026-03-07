/**
 * start 命令 — 启动消耗任务
 * 交互式设定目标 → 选策略 → 选模型 → 预估确认 → 执行
 */

import { select, input, confirm } from '@inquirer/prompts';
import { logger } from '../../utils/logger.js';
import { loadConfig, validateConfig } from '../../config/schema.js';
import { OpenAIProvider } from '../../providers/openai.js';
import { TurboStrategy } from '../../strategies/turbo.js';
import { NaturalStrategy } from '../../strategies/natural.js';
import { selectModel } from '../../core/model-selector.js';
import { estimateTask } from '../../core/estimator.js';
import { BurnEngine } from '../../core/engine.js';
import { createTask, updateTaskProgress, completeTask } from '../../storage/models.js';
import type { BurnStrategy } from '../../strategies/base.js';
import type { Command } from 'commander';

/**
 * 解析 Token 数量输入（支持 1K / 10K / 1M 格式）
 */
function parseTokenTarget(value: string): number {
    const cleaned = value.trim().toUpperCase().replace(/,/g, '');
    if (cleaned.endsWith('M')) return parseFloat(cleaned) * 1_000_000;
    if (cleaned.endsWith('K')) return parseFloat(cleaned) * 1_000;
    return parseInt(cleaned, 10);
}

/**
 * 获取策略实例
 */
function getStrategy(name: string): BurnStrategy {
    switch (name) {
        case 'turbo': return new TurboStrategy();
        case 'natural': return new NaturalStrategy();
        default: return new NaturalStrategy();
    }
}

export function registerStartCommand(program: Command): void {
    program
        .command('start')
        .description('启动 Token 消耗任务')
        .option('-t, --target <tokens>', '目标 Token 数量（支持 10K/1M 格式）')
        .option('-s, --strategy <name>', '消耗策略 (turbo|natural)', 'natural')
        .option('-m, --model <name>', '模型名称')
        .option('--dry-run', '模拟模式，不实际调用 API', false)
        .option('--no-camouflage', '禁用伪装延迟')
        .action(async (opts) => {
            try {
                await runStart(opts);
            } catch (error) {
                if ((error as Error).name === 'ExitPromptError') {
                    logger.info('已取消');
                    return;
                }
                logger.error(`执行失败: ${(error as Error).message}`);
                process.exit(1);
            }
        });
}

async function runStart(opts: {
    target?: string;
    strategy: string;
    model?: string;
    dryRun: boolean;
    camouflage: boolean;
}): Promise<void> {
    // 1. 加载并校验配置
    const config = loadConfig();

    if (!opts.dryRun) {
        const validation = validateConfig(config);
        if (!validation.valid) {
            validation.errors.forEach(e => logger.error(e));
            return;
        }
    }

    // 2. 创建 Provider
    const provider = new OpenAIProvider(config.apiKey, config.baseUrl);

    // 3. 选择策略
    let strategyName = opts.strategy;
    if (!opts.strategy || opts.strategy === 'natural') {
        strategyName = await select({
            message: '📊 选择消耗策略:',
            choices: [
                { name: '🔥 极速模式 — 最大化消耗效率，短间隔密集调用', value: 'turbo' },
                { name: '📚 自然模式 — 模拟真实对话，高伪装度', value: 'natural' },
            ],
            default: 'natural',
        });
    }
    const strategy = getStrategy(strategyName);

    // 4. 选择模型
    let modelId = opts.model;
    if (!modelId) {
        const modelInfo = await selectModel(provider);
        modelId = modelInfo.id;
    }

    // 5. 设定目标
    let targetTokens: number;
    if (opts.target) {
        targetTokens = parseTokenTarget(opts.target);
    } else {
        const targetInput = await input({
            message: '🎯 目标 Token 数量 (支持 1K/10K/1M 格式):',
            default: '10K',
            validate: (val) => {
                const n = parseTokenTarget(val);
                if (isNaN(n) || n <= 0) return '请输入有效的正整数';
                return true;
            },
        });
        targetTokens = parseTokenTarget(targetInput);
    }

    // 6. 预估费用
    const estimate = estimateTask(
        targetTokens,
        modelId,
        strategy.estimateTokensPerCall(),
        strategy.getDelay()
    );

    console.log('');
    logger.info('📋 任务预估:');
    logger.info(`   目标 Token:   ${logger.highlight(targetTokens.toLocaleString())}`);
    logger.info(`   预估费用:     ${logger.costColor(estimate.estimatedCostUsd)}`);
    logger.info(`   预估时间:     ${logger.highlight(estimate.estimatedTimeFormatted)}`);
    logger.info(`   预估调用次数: ${logger.highlight(estimate.estimatedCalls)}`);
    logger.info(`   费用上限:     ${logger.costColor(config.costLimitUsd)}`);
    console.log('');

    // 7. 确认开始
    if (!opts.dryRun) {
        const confirmed = await confirm({
            message: '确认开始消耗？',
            default: true,
        });
        if (!confirmed) {
            logger.info('已取消');
            return;
        }
    }

    // 8. 创建任务记录
    const task = createTask({
        strategy: strategyName,
        model: modelId,
        targetTokens,
        costLimitUsd: config.costLimitUsd,
        dryRun: opts.dryRun,
    });

    // 9. 启动引擎
    const engine = new BurnEngine({
        provider,
        strategy,
        model: modelId,
        targetTokens,
        costLimitUsd: config.costLimitUsd,
        dryRun: opts.dryRun,
        useCamouflageDelay: opts.camouflage && !opts.dryRun,
    });

    // Ctrl+C 处理
    process.on('SIGINT', () => {
        engine.abort();
        completeTask(task.id, 'stopped', '用户手动中止 (Ctrl+C)');
    });

    const result = await engine.run();

    // 10. 更新任务记录
    updateTaskProgress(task.id, result.totalTokens, result.totalCostUsd, result.totalCalls);
    completeTask(
        task.id,
        result.completed ? 'completed' : 'stopped',
        result.stoppedReason
    );
}
