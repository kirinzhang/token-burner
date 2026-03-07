/**
 * status 命令 — 查看任务历史
 */

import chalk from 'chalk';
import { logger } from '../../utils/logger.js';
import { formatCost } from '../../utils/cost-calculator.js';
import { getRecentTasks } from '../../storage/models.js';
import type { Command } from 'commander';
import type { TaskRecord } from '../../storage/models.js';

export function registerStatusCommand(program: Command): void {
    program
        .command('status')
        .description('查看消耗任务历史')
        .option('-n, --limit <count>', '显示最近 N 条记录', '10')
        .action((opts) => {
            showStatus(parseInt(opts.limit, 10));
        });
}

function showStatus(limit: number): void {
    const tasks = getRecentTasks(limit);

    if (tasks.length === 0) {
        logger.info('暂无任务记录。使用 `token-burner start` 创建第一个任务');
        return;
    }

    console.log('');
    logger.info(`📋 最近 ${tasks.length} 条任务记录:`);
    console.log('');

    // 表头
    const header = [
        'ID'.padEnd(10),
        '策略'.padEnd(10),
        '模型'.padEnd(16),
        '进度'.padEnd(20),
        '费用'.padEnd(10),
        '状态'.padEnd(10),
        '时间',
    ].join(' ');

    console.log(chalk.gray(header));
    console.log(chalk.gray('─'.repeat(100)));

    for (const task of tasks) {
        printTaskRow(task);
    }

    console.log('');
}

function printTaskRow(task: TaskRecord): void {
    const statusIcon = getStatusIcon(task.status);
    const progress = `${formatTokens(task.consumedTokens)}/${formatTokens(task.targetTokens)}`;
    const percentage = Math.min(100, (task.consumedTokens / task.targetTokens) * 100).toFixed(0);

    const row = [
        task.id.padEnd(10),
        `${getStrategyIcon(task.strategy)} ${task.strategy}`.padEnd(10),
        task.model.padEnd(16),
        `${progress} (${percentage}%)`.padEnd(20),
        formatCost(task.totalCostUsd).padEnd(10),
        `${statusIcon} ${task.status}`.padEnd(10),
        formatDate(task.startedAt),
    ].join(' ');

    console.log(row);
}

function getStatusIcon(status: string): string {
    switch (status) {
        case 'running': return chalk.blue('●');
        case 'completed': return chalk.green('✔');
        case 'stopped': return chalk.yellow('⏹');
        case 'failed': return chalk.red('✖');
        default: return chalk.gray('○');
    }
}

function getStrategyIcon(strategy: string): string {
    switch (strategy) {
        case 'turbo': return '🔥';
        case 'natural': return '📚';
        default: return '📋';
    }
}

function formatTokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

function formatDate(isoString: string): string {
    const d = new Date(isoString);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}
