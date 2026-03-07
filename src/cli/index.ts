#!/usr/bin/env node

/**
 * Token Burner — CLI 主入口
 * AI Token 自动消耗工具
 */

import { Command } from 'commander';
import { registerStartCommand } from './commands/start.js';
import { registerConfigCommand } from './commands/config.js';
import { registerStatusCommand } from './commands/status.js';

const program = new Command();

program
    .name('token-burner')
    .description('🔥 AI Token 自动消耗工具 — Burn tokens like a pro.')
    .version('0.1.0');

// 注册子命令
registerStartCommand(program);
registerConfigCommand(program);
registerStatusCommand(program);

program.parse();
