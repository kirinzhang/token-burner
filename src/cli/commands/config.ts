/**
 * config 命令 — 配置管理（API Key / Provider / 费用上限）
 */

import { input, select } from '@inquirer/prompts';
import { logger } from '../../utils/logger.js';
import { loadConfig, saveConfig, validateApiKey } from '../../config/schema.js';
import type { Command } from 'commander';

export function registerConfigCommand(program: Command): void {
    const configCmd = program
        .command('config')
        .description('管理配置');

    configCmd
        .command('set-key')
        .description('配置 API Key')
        .action(async () => {
            try {
                await setApiKey();
            } catch (error) {
                if ((error as Error).name === 'ExitPromptError') return;
                logger.error(`配置失败: ${(error as Error).message}`);
            }
        });

    configCmd
        .command('set-limit')
        .description('设置费用上限')
        .action(async () => {
            try {
                await setCostLimit();
            } catch (error) {
                if ((error as Error).name === 'ExitPromptError') return;
                logger.error(`配置失败: ${(error as Error).message}`);
            }
        });

    configCmd
        .command('set-url')
        .description('设置 API Base URL（用于代理/自定义 Endpoint）')
        .action(async () => {
            try {
                await setBaseUrl();
            } catch (error) {
                if ((error as Error).name === 'ExitPromptError') return;
                logger.error(`配置失败: ${(error as Error).message}`);
            }
        });

    configCmd
        .command('show')
        .description('显示当前配置')
        .action(() => {
            showConfig();
        });
}

async function setApiKey(): Promise<void> {
    const config = loadConfig();

    const provider = await select({
        message: '选择 API 提供商:',
        choices: [
            { name: 'OpenAI', value: 'openai' },
            { name: 'OpenAI 兼容 (自定义 Endpoint)', value: 'openai-compatible' },
        ],
        default: config.provider,
    });

    const apiKey = await input({
        message: '输入 API Key:',
        validate: (val) => {
            if (!validateApiKey(val)) return '无效的 API Key 格式';
            return true;
        },
    });

    config.provider = provider;
    config.apiKey = apiKey;
    saveConfig(config);

    logger.success('API Key 已保存');
}

async function setCostLimit(): Promise<void> {
    const config = loadConfig();

    const limitStr = await input({
        message: '设置费用上限（USD）:',
        default: String(config.costLimitUsd),
        validate: (val) => {
            const n = parseFloat(val);
            if (isNaN(n) || n <= 0) return '请输入有效的正数';
            return true;
        },
    });

    config.costLimitUsd = parseFloat(limitStr);
    saveConfig(config);

    logger.success(`费用上限已设置为 $${config.costLimitUsd}`);
}

async function setBaseUrl(): Promise<void> {
    const config = loadConfig();

    const url = await input({
        message: 'API Base URL:',
        default: config.baseUrl,
    });

    config.baseUrl = url;
    saveConfig(config);

    logger.success(`API Base URL 已设置为 ${url}`);
}

function showConfig(): void {
    const config = loadConfig();
    const maskedKey = config.apiKey
        ? `${config.apiKey.slice(0, 7)}...${config.apiKey.slice(-4)}`
        : '(未配置)';

    console.log('');
    logger.info('⚙️  当前配置:');
    logger.info(`   Provider:     ${logger.highlight(config.provider)}`);
    logger.info(`   API Key:      ${maskedKey}`);
    logger.info(`   Base URL:     ${config.baseUrl}`);
    logger.info(`   默认模型:     ${config.defaultModel}`);
    logger.info(`   费用上限:     ${logger.costColor(config.costLimitUsd)}`);
    console.log('');
}
