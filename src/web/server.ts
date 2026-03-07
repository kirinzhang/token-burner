/**
 * Express Web Server — Token Burner Dashboard
 * 提供 REST API + SSE 实时流，供前端 Dashboard 使用
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { configRouter } from './routes/config.js';
import { taskRouter } from './routes/task.js';
import { modelsRouter } from './routes/models.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT ?? '3000', 10);

const app = express();

app.use(cors());
app.use(express.json());

// 静态文件服务（前端页面）
app.use(express.static(join(__dirname, '../../web')));

// API 路由
app.use('/api/config', configRouter);
app.use('/api/task', taskRouter);
app.use('/api/tasks', taskRouter);   // 别名，兼容前端 /api/tasks 历史列表请求
app.use('/api/models', modelsRouter);

// 全局错误处理
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Server Error]', err.message);
    res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
    console.log(`\n🔥 Token Burner Dashboard 已启动`);
    console.log(`   访问地址: http://localhost:${PORT}\n`);
});
