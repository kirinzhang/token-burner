/**
 * 核心消耗引擎 — 调度、计量、限速、断点续传、dry-run
 */

import { logger } from '../utils/logger.js';
import { calculateCost } from '../utils/cost-calculator.js';
import { ConversationSimulator } from '../camouflage/conversation-sim.js';
import { addJitter, getHumanLikeDelay } from '../camouflage/time-pattern.js';
import { ProgressTracker } from './tracker.js';
import { createInitialContext } from '../strategies/base.js';
import type { BurnStrategy, ConversationContext } from '../strategies/base.js';
import type { AIProvider } from '../providers/base.js';
import { addConsumptionLog } from '../storage/models.js';

export interface ProgressStats {
    consumedTokens: number;
    targetTokens: number;
    totalCostUsd: number;
    totalCalls: number;
    elapsedMs: number;
}

export interface EngineOptions {
    provider: AIProvider;
    strategy: BurnStrategy;
    model: string;
    targetTokens: number;
    costLimitUsd: number;
    dryRun: boolean;
    useCamouflageDelay: boolean;
    taskId?: string;
    onProgress?: (stats: ProgressStats) => void;
}

export interface EngineResult {
    totalTokens: number;
    totalCostUsd: number;
    totalCalls: number;
    elapsedMs: number;
    completed: boolean;
    stoppedReason?: string;
}

/**
 * 延迟指定时间（毫秒）
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 消耗引擎
 * 核心调度器，控制整个 Token 消耗流程
 */
export class BurnEngine {
    private options: EngineOptions;
    private conversationSim: ConversationSimulator;
    private tracker: ProgressTracker;
    private context: ConversationContext;
    private aborted = false;

    constructor(options: EngineOptions) {
        this.options = options;
        this.conversationSim = new ConversationSimulator();
        this.tracker = new ProgressTracker(options.targetTokens, !options.dryRun);
        this.context = createInitialContext();
    }

    /**
     * 启动消耗任务
     */
    async run(): Promise<EngineResult> {
        const { provider, strategy, model, targetTokens, costLimitUsd, dryRun } = this.options;
        const startTime = Date.now();

        logger.info(`🚀 开始消耗任务`);
        logger.info(`   模型: ${logger.highlight(model)}`);
        logger.info(`   策略: ${strategy.icon} ${strategy.name}`);
        logger.info(`   目标: ${logger.highlight(targetTokens.toLocaleString())} tokens`);
        logger.info(`   费用上限: ${logger.costColor(costLimitUsd)}`);
        if (dryRun) {
            logger.warn('⚡ DRY-RUN 模式 — 不会实际调用 API');
        }
        console.log('');

        let totalTokens = 0;
        let totalCostUsd = 0;
        let totalCalls = 0;
        let stoppedReason: string | undefined;

        while (strategy.shouldContinue(totalTokens, targetTokens) && !this.aborted) {
            // 检查费用上限
            if (totalCostUsd >= costLimitUsd) {
                stoppedReason = `已达费用上限 ${logger.costColor(costLimitUsd)}`;
                logger.warn(stoppedReason);
                break;
            }

            // 生成 Prompt
            const result = strategy.generatePrompt(this.context, model);

            if (dryRun) {
                // Dry-run 模式：模拟消耗
                const simulatedTokens = result.estimatedTokens;
                const cost = calculateCost(model, simulatedTokens * 0.35, simulatedTokens * 0.65);

                totalTokens += simulatedTokens;
                totalCostUsd += cost.totalCostUsd;
                totalCalls++;

                this.tracker.update(simulatedTokens, cost.totalCostUsd);
                this.options.onProgress?.({ consumedTokens: totalTokens, targetTokens, totalCostUsd, totalCalls, elapsedMs: Date.now() - startTime });

                // dry-run 用短间隔
                await sleep(100);
            } else {
                try {
                    // 真实调用 API
                    const response = await provider.sendMessage(result.payload);

                    totalTokens += response.totalTokens;
                    const cost = calculateCost(model, response.inputTokens, response.outputTokens);
                    totalCostUsd += cost.totalCostUsd;
                    totalCalls++;

                    // 更新进度
                    this.tracker.update(response.totalTokens, cost.totalCostUsd);
                    this.options.onProgress?.({ consumedTokens: totalTokens, targetTokens, totalCostUsd, totalCalls, elapsedMs: Date.now() - startTime });

                    // 记录调用日志（供历史详情查看）+ 更新对话上下文
                    const lastUserMsg = result.payload.messages[result.payload.messages.length - 1];
                    if (this.options.taskId) {
                        addConsumptionLog({
                            taskId: this.options.taskId,
                            inputTokens: response.inputTokens,
                            outputTokens: response.outputTokens,
                            totalTokens: response.totalTokens,
                            costUsd: cost.totalCostUsd,
                            model,
                            durationMs: response.durationMs,
                            promptPreview: lastUserMsg?.content?.slice(0, 500),
                            responsePreview: response.content?.slice(0, 1000),
                        });
                    }
                    if (lastUserMsg) {
                        this.conversationSim.updateContext(this.context, lastUserMsg.content, response);
                    }

                    // 伪装延迟
                    if (this.options.useCamouflageDelay) {
                        const delay = addJitter(getHumanLikeDelay());
                        logger.debug(`等待 ${(delay / 1000).toFixed(0)}s...`);
                        await sleep(delay);
                    } else {
                        const delay = addJitter(result.suggestedDelayMs);
                        await sleep(delay);
                    }
                } catch (error) {
                    const err = error as Error;
                    logger.error(`API 调用出错: ${err.message}`);

                    // 指数退避重试
                    const retryDelay = Math.min(30_000, 2000 * Math.pow(2, totalCalls % 5));
                    logger.warn(`${(retryDelay / 1000).toFixed(0)}s 后重试...`);
                    await sleep(retryDelay);
                }
            }
        }

        // 任务完成
        this.tracker.finish();
        console.log('');

        const completed = totalTokens >= targetTokens;
        if (completed) {
            logger.success('🎉 消耗任务完成！');
        } else if (stoppedReason) {
            logger.warn(`⏹ 任务提前停止: ${stoppedReason}`);
        }

        const elapsedMs = Date.now() - startTime;
        this.printSummary(totalTokens, totalCostUsd, totalCalls, elapsedMs);

        return { totalTokens, totalCostUsd, totalCalls, elapsedMs, completed, stoppedReason };
    }

    /**
     * 中止任务
     */
    abort(): void {
        this.aborted = true;
        logger.warn('任务中止中...');
    }

    private printSummary(tokens: number, cost: number, calls: number, elapsedMs: number): void {
        const seconds = elapsedMs / 1000;
        const speed = seconds > 0 ? (tokens / seconds).toFixed(0) : '0';

        console.log('');
        logger.info('📊 消耗报告:');
        logger.info(`   消耗 Token: ${logger.highlight(tokens.toLocaleString())}`);
        logger.info(`   总费用:     ${logger.costColor(cost)}`);
        logger.info(`   API 调用:   ${logger.highlight(calls)} 次`);
        logger.info(`   总耗时:     ${logger.highlight(formatElapsed(elapsedMs))}`);
        logger.info(`   平均速率:   ${logger.highlight(speed)} tokens/s`);
    }
}

function formatElapsed(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes < 60) return `${minutes}m ${secs}s`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}
