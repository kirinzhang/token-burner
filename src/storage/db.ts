/**
 * SQLite 连接管理 — 单例模式
 */

import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

const DB_DIR = join(homedir(), '.token-burner');
const DB_PATH = join(DB_DIR, 'data.db');

let dbInstance: Database.Database | null = null;

/**
 * 获取数据库连接（单例）
 */
export function getDb(): Database.Database {
    if (dbInstance) return dbInstance;

    if (!existsSync(DB_DIR)) {
        mkdirSync(DB_DIR, { recursive: true });
    }

    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');

    initTables(dbInstance);
    return dbInstance;
}

/**
 * 初始化数据库表
 */
function initTables(db: Database.Database): void {
    db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      strategy TEXT NOT NULL,
      model TEXT NOT NULL,
      target_tokens INTEGER NOT NULL,
      consumed_tokens INTEGER DEFAULT 0,
      total_cost_usd REAL DEFAULT 0,
      total_calls INTEGER DEFAULT 0,
      status TEXT DEFAULT 'running',
      cost_limit_usd REAL DEFAULT 10,
      dry_run INTEGER DEFAULT 0,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      stopped_reason TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS consumption_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL,
      input_tokens INTEGER NOT NULL,
      output_tokens INTEGER NOT NULL,
      total_tokens INTEGER NOT NULL,
      cost_usd REAL NOT NULL,
      model TEXT NOT NULL,
      duration_ms INTEGER NOT NULL,
      prompt_preview TEXT,
      response_preview TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    );

    CREATE INDEX IF NOT EXISTS idx_logs_task_id ON consumption_logs(task_id);
  `);
}

/**
 * 关闭数据库连接
 */
export function closeDb(): void {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
    }
}
