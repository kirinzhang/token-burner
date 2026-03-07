/**
 * 日志工具 — 基于 chalk 的彩色日志输出
 */

import chalk from 'chalk';

const PREFIX = chalk.bold('[token-burner]');

export const logger = {
    info(msg: string, ...args: unknown[]): void {
        console.log(`${PREFIX} ${chalk.blue('ℹ')} ${msg}`, ...args);
    },

    success(msg: string, ...args: unknown[]): void {
        console.log(`${PREFIX} ${chalk.green('✔')} ${msg}`, ...args);
    },

    warn(msg: string, ...args: unknown[]): void {
        console.log(`${PREFIX} ${chalk.yellow('⚠')} ${msg}`, ...args);
    },

    error(msg: string, ...args: unknown[]): void {
        console.error(`${PREFIX} ${chalk.red('✖')} ${msg}`, ...args);
    },

    debug(msg: string, ...args: unknown[]): void {
        if (process.env.DEBUG) {
            console.log(`${PREFIX} ${chalk.gray('⚙')} ${msg}`, ...args);
        }
    },

    /** 带颜色的关键数值高亮 */
    highlight(value: string | number): string {
        return chalk.cyan.bold(String(value));
    },

    /** 费用高亮（绿色=便宜, 黄色=中等, 红色=昂贵） */
    costColor(usd: number): string {
        const formatted = `$${usd.toFixed(4)}`;
        if (usd < 0.01) return chalk.green(formatted);
        if (usd < 0.1) return chalk.yellow(formatted);
        return chalk.red(formatted);
    },
};
