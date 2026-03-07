/**
 * 数据模型 — 任务记录和消耗日志的 CRUD 操作
 */

import { randomUUID } from 'node:crypto';
import { getDb } from './db.js';

export interface TaskRecord {
    id: string;
    strategy: string;
    model: string;
    targetTokens: number;
    consumedTokens: number;
    totalCostUsd: number;
    totalCalls: number;
    status: 'running' | 'completed' | 'stopped' | 'failed';
    costLimitUsd: number;
    dryRun: boolean;
    startedAt: string;
    completedAt?: string;
    stoppedReason?: string;
}

export interface ConsumptionLog {
    id?: number;
    taskId: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: number;
    model: string;
    durationMs: number;
    promptPreview?: string;
    responsePreview?: string;
    createdAt?: string;
}

/**
 * 创建新任务记录
 */
export function createTask(task: Omit<TaskRecord, 'id' | 'consumedTokens' | 'totalCostUsd' | 'totalCalls' | 'status' | 'startedAt'>): TaskRecord {
    const db = getDb();
    const id = randomUUID().slice(0, 8);
    const startedAt = new Date().toISOString();

    db.prepare(`
    INSERT INTO tasks (id, strategy, model, target_tokens, cost_limit_usd, dry_run, started_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, task.strategy, task.model, task.targetTokens, task.costLimitUsd, task.dryRun ? 1 : 0, startedAt);

    return {
        id,
        strategy: task.strategy,
        model: task.model,
        targetTokens: task.targetTokens,
        consumedTokens: 0,
        totalCostUsd: 0,
        totalCalls: 0,
        status: 'running',
        costLimitUsd: task.costLimitUsd,
        dryRun: task.dryRun,
        startedAt,
    };
}

/**
 * 更新任务进度
 */
export function updateTaskProgress(
    taskId: string,
    consumedTokens: number,
    totalCostUsd: number,
    totalCalls: number
): void {
    const db = getDb();
    db.prepare(`
    UPDATE tasks SET consumed_tokens = ?, total_cost_usd = ?, total_calls = ?
    WHERE id = ?
  `).run(consumedTokens, totalCostUsd, totalCalls, taskId);
}

/**
 * 标记任务完成/停止
 */
export function completeTask(
    taskId: string,
    status: 'completed' | 'stopped' | 'failed',
    stoppedReason?: string
): void {
    const db = getDb();
    db.prepare(`
    UPDATE tasks SET status = ?, completed_at = datetime('now'), stopped_reason = ?
    WHERE id = ?
  `).run(status, stoppedReason ?? null, taskId);
}

/**
 * 添加消耗日志
 */
export function addConsumptionLog(log: Omit<ConsumptionLog, 'id' | 'createdAt'>): void {
    const db = getDb();
    db.prepare(`
    INSERT INTO consumption_logs (task_id, input_tokens, output_tokens, total_tokens, cost_usd, model, duration_ms, prompt_preview, response_preview)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
        log.taskId, log.inputTokens, log.outputTokens, log.totalTokens,
        log.costUsd, log.model, log.durationMs,
        log.promptPreview ?? null, log.responsePreview ?? null
    );
}

/**
 * 获取任务列表（最近 N 条）
 */
export function getRecentTasks(limit = 10): TaskRecord[] {
    const db = getDb();
    const rows = db.prepare(`
    SELECT id, strategy, model, target_tokens, consumed_tokens, total_cost_usd,
           total_calls, status, cost_limit_usd, dry_run, started_at, completed_at, stopped_reason
    FROM tasks ORDER BY created_at DESC LIMIT ?
  `).all(limit) as Array<Record<string, unknown>>;

    return rows.map(row => ({
        id: row.id as string,
        strategy: row.strategy as string,
        model: row.model as string,
        targetTokens: row.target_tokens as number,
        consumedTokens: row.consumed_tokens as number,
        totalCostUsd: row.total_cost_usd as number,
        totalCalls: row.total_calls as number,
        status: row.status as TaskRecord['status'],
        costLimitUsd: row.cost_limit_usd as number,
        dryRun: (row.dry_run as number) === 1,
        startedAt: row.started_at as string,
        completedAt: row.completed_at as string | undefined,
        stoppedReason: row.stopped_reason as string | undefined,
    }));
}

/**
 * 获取单个任务详情
 */
export function getTaskById(taskId: string): TaskRecord | undefined {
    const db = getDb();
    const row = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(taskId) as Record<string, unknown> | undefined;

    if (!row) return undefined;

    return {
        id: row.id as string,
        strategy: row.strategy as string,
        model: row.model as string,
        targetTokens: row.target_tokens as number,
        consumedTokens: row.consumed_tokens as number,
        totalCostUsd: row.total_cost_usd as number,
        totalCalls: row.total_calls as number,
        status: row.status as TaskRecord['status'],
        costLimitUsd: row.cost_limit_usd as number,
        dryRun: (row.dry_run as number) === 1,
        startedAt: row.started_at as string,
        completedAt: row.completed_at as string | undefined,
        stoppedReason: row.stopped_reason as string | undefined,
    };
}

/**
 * 获取任务的 API 调用日志列表（聊天记录）
 */
export function getTaskLogs(taskId: string, limit = 50): ConsumptionLog[] {
    const db = getDb();
    const rows = db.prepare(`
    SELECT id, task_id, input_tokens, output_tokens, total_tokens, cost_usd,
           model, duration_ms, prompt_preview, response_preview, created_at
    FROM consumption_logs WHERE task_id = ? ORDER BY id ASC LIMIT ?
  `).all(taskId, limit) as Array<Record<string, unknown>>;

    return rows.map(row => ({
        id: row.id as number,
        taskId: row.task_id as string,
        inputTokens: row.input_tokens as number,
        outputTokens: row.output_tokens as number,
        totalTokens: row.total_tokens as number,
        costUsd: row.cost_usd as number,
        model: row.model as string,
        durationMs: row.duration_ms as number,
        promptPreview: row.prompt_preview as string | undefined,
        responsePreview: row.response_preview as string | undefined,
        createdAt: row.created_at as string,
    }));
}
