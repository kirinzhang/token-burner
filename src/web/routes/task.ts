/**
 * API 路由 — 任务管理
 * 支持 SSE 实时推送进度
 */

import { Router } from 'express';
import type { Response } from 'express';
import { loadConfig, validateConfig } from '../../config/schema.js';
import { OpenAIProvider } from '../../providers/openai.js';
import { TurboStrategy } from '../../strategies/turbo.js';
import { NaturalStrategy } from '../../strategies/natural.js';
import { BurnEngine } from '../../core/engine.js';
import type { ProgressStats } from '../../core/engine.js';
import { estimateTask } from '../../core/estimator.js';
import { getRecentTasks, createTask, updateTaskProgress, completeTask, getTaskLogs } from '../../storage/models.js';
import type { BurnStrategy } from '../../strategies/base.js';

export const taskRouter = Router();

// 运行中的任务引擎 Map（taskId → engine）
const runningEngines = new Map<string, BurnEngine>();
// SSE 客户端 Map（taskId → res[]）
const sseClients = new Map<string, Response[]>();

function getStrategy(name: string): BurnStrategy {
    if (name === 'turbo') return new TurboStrategy();
    return new NaturalStrategy();
}

function parseTokenTarget(value: string): number {
    const cleaned = String(value).trim().toUpperCase().replace(/,/g, '');
    if (cleaned.endsWith('M')) return parseFloat(cleaned) * 1_000_000;
    if (cleaned.endsWith('K')) return parseFloat(cleaned) * 1_000;
    return parseInt(cleaned, 10);
}

function sendSSE(taskId: string, event: string, data: unknown): void {
    const clients = sseClients.get(taskId) ?? [];
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of clients) {
        client.write(payload);
    }
}

/**
 * GET /api/tasks — 历史任务列表
 */
taskRouter.get('/', (_req, res) => {
    const tasks = getRecentTasks(20);
    res.json(tasks);
});

/**
 * POST /api/task/estimate — 预估费用（不启动任务）
 */
taskRouter.post('/estimate', (req, res) => {
    const { targetTokens: rawTarget, strategy = 'natural', model } = req.body as {
        targetTokens: string | number;
        strategy?: string;
        model: string;
    };

    const targetTokens = parseTokenTarget(String(rawTarget));
    const strat = getStrategy(strategy);
    const estimate = estimateTask(targetTokens, model, strat.estimateTokensPerCall(), strat.getDelay());

    res.json(estimate);
});

/**
 * POST /api/task/start — 启动消耗任务
 */
taskRouter.post('/start', async (req, res) => {
    const { targetTokens: rawTarget, strategy = 'natural', model, dryRun = false } = req.body as {
        targetTokens: string | number;
        strategy?: string;
        model: string;
        dryRun?: boolean;
    };

    const config = loadConfig();

    if (!dryRun) {
        const validation = validateConfig(config);
        if (!validation.valid) {
            res.status(400).json({ error: validation.errors.join('; ') });
            return;
        }
    }

    const targetTokens = parseTokenTarget(String(rawTarget));
    if (isNaN(targetTokens) || targetTokens <= 0) {
        res.status(400).json({ error: '无效的目标 Token 数量' });
        return;
    }

    const provider = new OpenAIProvider(config.apiKey, config.baseUrl);
    const stratInstance = getStrategy(strategy);

    // 创建任务记录
    const task = createTask({
        strategy,
        model,
        targetTokens,
        costLimitUsd: config.costLimitUsd,
        dryRun,
    });

    // 立即返回 taskId
    res.json({ taskId: task.id, message: '任务已启动' });

    // 异步执行消耗（不阻塞响应）
    const engine = new BurnEngine({
        provider,
        strategy: stratInstance,
        model,
        targetTokens,
        costLimitUsd: config.costLimitUsd,
        dryRun,
        useCamouflageDelay: false,
        taskId: task.id,
        onProgress: (stats) => {
            sendSSE(task.id, 'progress', {
                consumedTokens: stats.consumedTokens,
                targetTokens: stats.targetTokens,
                totalCostUsd: stats.totalCostUsd,
                totalCalls: stats.totalCalls,
                percentage: Math.min(100, (stats.consumedTokens / stats.targetTokens) * 100),
                elapsedMs: stats.elapsedMs,
            });
            // 实时更新数据库
            updateTaskProgress(task.id, stats.consumedTokens, stats.totalCostUsd, stats.totalCalls);
        },
    });

    runningEngines.set(task.id, engine);

    engine.run().then((result) => {
        updateTaskProgress(task.id, result.totalTokens, result.totalCostUsd, result.totalCalls);
        completeTask(task.id, result.completed ? 'completed' : 'stopped', result.stoppedReason);
        sendSSE(task.id, 'done', {
            totalTokens: result.totalTokens,
            totalCostUsd: result.totalCostUsd,
            totalCalls: result.totalCalls,
            elapsedMs: result.elapsedMs,
            completed: result.completed,
        });
        runningEngines.delete(task.id);
        // 关闭 SSE 连接
        setTimeout(() => {
            const clients = sseClients.get(task.id) ?? [];
            for (const c of clients) c.end();
            sseClients.delete(task.id);
        }, 1000);
    }).catch((err: Error) => {
        completeTask(task.id, 'failed', err.message);
        sendSSE(task.id, 'error', { message: err.message });
        runningEngines.delete(task.id);
    });
});

/**
 * GET /api/task/stream/:taskId — SSE 实时进度流
 */
taskRouter.get('/stream/:taskId', (req, res) => {
    const { taskId } = req.params;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // 注册 SSE 客户端
    if (!sseClients.has(taskId)) sseClients.set(taskId, []);
    sseClients.get(taskId)!.push(res);

    // 连接建立确认
    res.write(`event: connected\ndata: ${JSON.stringify({ taskId })}\n\n`);

    // 断线清理
    req.on('close', () => {
        const clients = sseClients.get(taskId) ?? [];
        const idx = clients.indexOf(res);
        if (idx > -1) clients.splice(idx, 1);
    });
});

/**
 * DELETE /api/task/:taskId — 中止任务
 */
taskRouter.delete('/:taskId', (req, res) => {
    const { taskId } = req.params;
    const engine = runningEngines.get(taskId);

    if (engine) {
        engine.abort();
        runningEngines.delete(taskId);
        res.json({ success: true, message: '任务已中止' });
    } else {
        res.status(404).json({ error: '任务不存在或已完成' });
    }
});

/**
 * GET /api/task/logs/:taskId — 获取任务的 API 调用记录
 */
taskRouter.get('/logs/:taskId', (req, res) => {
    const { taskId } = req.params;
    const logs = getTaskLogs(taskId);
    res.json(logs);
});
