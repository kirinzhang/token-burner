# Token Burner — Phase 1 MVP 开发

## 项目初始化
- [ ] 创建项目目录、初始化 npm + TypeScript 配置
- [ ] 安装核心依赖（commander, inquirer, openai, chalk, cli-progress, better-sqlite3, tiktoken）
- [ ] 配置 tsconfig.json + package.json scripts

## 核心模块开发
- [ ] 配置管理 (`config/`)：默认配置 + Schema 校验 + API Key 管理
- [ ] Provider 层 (`providers/`)：Provider 接口 + OpenAI 适配 + 模型列表 + 价格信息
- [ ] Token 计数 (`utils/token-counter.ts`)：基于 tiktoken 的精确计数
- [ ] 费用计算 (`utils/cost-calculator.ts`)：基于模型价格的实时费用计算

## 策略模块开发
- [ ] 策略基类/接口 (`strategies/base.ts`)
- [ ] 极速模式 (`strategies/turbo.ts`)
- [ ] 自然模式 (`strategies/natural.ts`)

## 伪装引擎基础
- [ ] 时间分布模拟 (`camouflage/time-pattern.ts`)
- [ ] 多轮对话模拟器 (`camouflage/conversation-sim.ts`)
- [ ] 话题路由 (`camouflage/topic-router.ts`)

## Prompt 模板库
- [ ] 开发类 Prompt 模板（frontend, backend, debugging）
- [ ] 上下文生成器（项目背景、对话链模板）

## 消耗引擎
- [ ] 核心引擎 (`core/engine.ts`)：调度、计量、限速、断点续传
- [ ] 成本估算器 (`core/estimator.ts`)
- [ ] 进度追踪器 (`core/tracker.ts`)
- [ ] 模型选择器 (`core/model-selector.ts`)

## 数据持久化
- [ ] SQLite 连接管理 (`storage/db.ts`)
- [ ] 数据模型 (`storage/models.ts`)

## CLI 入口
- [ ] CLI 主入口 + 命令注册
- [ ] `start` 命令：设定目标 + 选策略 + 选模型 + 执行
- [ ] `config` 命令：配置 API Key
- [ ] `status` 命令：查看当前/历史任务

## 验证
- [ ] dry-run 模式测试
- [ ] 真实 API 小量测试
