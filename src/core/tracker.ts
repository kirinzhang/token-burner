/**
 * 进度追踪器 — 实时追踪消耗进度
 */

import cliProgress from 'cli-progress';
import chalk from 'chalk';
import { formatCost } from '../utils/cost-calculator.js';

export interface ProgressStats {
    consumedTokens: number;
    targetTokens: number;
    totalCostUsd: number;
    totalCalls: number;
    startTime: number;
    elapsedMs: number;
    estimatedRemainingMs: number;
    tokensPerSecond: number;
    percentage: number;
}

export class ProgressTracker {
    private consumedTokens = 0;
    private totalCostUsd = 0;
    private totalCalls = 0;
    private startTime = Date.now();
    private targetTokens: number;
    private progressBar: cliProgress.SingleBar | null = null;

    constructor(targetTokens: number, showBar = true) {
        this.targetTokens = targetTokens;

        if (showBar) {
            this.progressBar = new cliProgress.SingleBar({
                format: `${chalk.cyan('消耗进度')} |${chalk.cyan('{bar}')}| {percentage}% | {consumed}/{target} tokens | 费用: {cost} | 速率: {speed} t/s`,
                barCompleteChar: '█',
                barIncompleteChar: '░',
                hideCursor: true,
            });
            this.progressBar.start(targetTokens, 0, {
                consumed: '0',
                target: this.formatTokens(targetTokens),
                cost: '$0.0000',
                speed: '0',
            });
        }
    }

    /**
     * 更新进度
     */
    update(tokensConsumed: number, costUsd: number): void {
        this.consumedTokens += tokensConsumed;
        this.totalCostUsd += costUsd;
        this.totalCalls++;

        if (this.progressBar) {
            const stats = this.getStats();
            this.progressBar.update(this.consumedTokens, {
                consumed: this.formatTokens(this.consumedTokens),
                target: this.formatTokens(this.targetTokens),
                cost: formatCost(this.totalCostUsd),
                speed: stats.tokensPerSecond.toFixed(0),
            });
        }
    }

    /**
     * 获取当前统计信息
     */
    getStats(): ProgressStats {
        const elapsedMs = Date.now() - this.startTime;
        const tokensPerSecond = elapsedMs > 0
            ? (this.consumedTokens / elapsedMs) * 1000
            : 0;

        const remainingTokens = Math.max(0, this.targetTokens - this.consumedTokens);
        const estimatedRemainingMs = tokensPerSecond > 0
            ? (remainingTokens / tokensPerSecond) * 1000
            : 0;

        return {
            consumedTokens: this.consumedTokens,
            targetTokens: this.targetTokens,
            totalCostUsd: this.totalCostUsd,
            totalCalls: this.totalCalls,
            startTime: this.startTime,
            elapsedMs,
            estimatedRemainingMs,
            tokensPerSecond,
            percentage: Math.min(100, (this.consumedTokens / this.targetTokens) * 100),
        };
    }

    /**
     * 标记完成
     */
    finish(): void {
        if (this.progressBar) {
            this.progressBar.stop();
        }
    }

    /**
     * 判断是否已达到目标
     */
    isCompleted(): boolean {
        return this.consumedTokens >= this.targetTokens;
    }

    private formatTokens(n: number): string {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
        return String(n);
    }
}
