/**
 * 极速模式策略
 * 发送大段文本要求总结/翻译/扩写，最大化单次 Token 消耗
 */

import type { BurnStrategy, ConversationContext, StrategyResult } from './base.js';

/**
 * 极速模式预置 Prompt 模板
 * 每个模板设计为尽可能消耗大量 input + output Token
 */
const TURBO_PROMPTS = [
    {
        system: '你是一位资深技术专家，请提供详尽、全面的回答。回答需要包含代码示例、最佳实践、常见陷阱、性能分析和完整的实现方案。',
        templates: [
            '请详细设计一个完整的电商平台微服务架构，包括：服务拆分方案、数据库设计（含ER图）、API接口定义（RESTful规范）、消息队列选型、缓存策略、负载均衡方案、监控告警体系。每个部分都需要提供完整的代码示例和配置文件。',
            '请编写一个完整的 React + TypeScript 状态管理库，要求：支持 immer 不可变更新、middleware 中间件机制、devtools 调试、持久化存储、SSR 兼容。请提供完整的实现代码、类型定义、单元测试和使用文档。',
            '请详细分析和对比以下数据库在高并发场景下的表现：PostgreSQL、MySQL 8.0、MongoDB、CockroachDB、TiDB。包括：ACID支持对比、分库分表方案、读写分离实现、连接池优化、慢查询诊断方法、备份恢复策略。给出具体的 benchmark 数据和配置建议。',
            '请设计一个完整的 CI/CD Pipeline，技术栈：GitHub Actions + Docker + Kubernetes + ArgoCD。要求覆盖：代码质量检查（ESLint/Prettier/SonarQube）、单元测试、集成测试、容器镜像构建优化、蓝绿部署、金丝雀发布、自动回滚、监控集成。提供完整的 YAML 配置和 Dockerfile。',
            '请实现一个高性能的全文搜索引擎，使用 TypeScript 编写，支持：倒排索引构建、TF-IDF 评分、BM25 排序、模糊匹配、高亮显示、分面搜索、自动补全。要求提供完整的实现代码和性能测试。',
            '请设计一个分布式任务调度系统，支持：Cron表达式、任务依赖DAG、失败重试策略（指数退避）、任务优先级、分片执行、任务监控Dashboard。使用 Node.js + Redis + PostgreSQL 实现，提供完整代码。',
        ],
    },
    {
        system: '你是一位全栈开发教练，请提供极其详细的教学内容，包含原理分析、代码实现、实战案例和常见面试题。',
        templates: [
            '请编写一份完整的 Kubernetes 运维手册，涵盖：集群搭建（kubeadm）、网络方案（Calico/Flannel对比）、存储方案（PV/PVC/StorageClass）、RBAC权限管理、HPA自动伸缩、Pod调度策略、故障排查流程、生产环境最佳实践。每个主题配完整的YAML配置。',
            '请详细讲解 V8 引擎的垃圾回收机制，包括：新生代 Scavenge算法、老生代 Mark-Sweep/Mark-Compact、增量标记、并发标记、弱引用处理。然后实现一个简化版垃圾回收器的 TypeScript 模拟，并分析 Node.js 中常见的内存泄漏场景及排查方法。',
            '请设计并实现一个完整的 WebSocket 实时通信框架，支持：自动重连、心跳检测、消息确认ACK、房间管理、消息广播、二进制传输、压缩、鉴权中间件。包含服务端（Node.js）和客户端（TypeScript）的完整实现。',
        ],
    },
];

export class TurboStrategy implements BurnStrategy {
    readonly name = 'turbo';
    readonly description = '极速模式 — 大量文本处理，最大化单次 Token 消耗';
    readonly icon = '🔥';

    private promptIndex = 0;
    private categoryIndex = 0;

    estimateTokensPerCall(): number {
        // 极速模式期望每次消耗 3000~6000 Token（input + output）
        return 4500;
    }

    generatePrompt(context: ConversationContext, model: string): StrategyResult {
        const category = TURBO_PROMPTS[this.categoryIndex % TURBO_PROMPTS.length]!;
        const template = category.templates[this.promptIndex % category.templates.length]!;

        // 如果有上下文历史，追加后续问题以消耗更多 Token
        const userContent = context.roundCount > 0 && context.history.length > 0
            ? `基于之前的回答，请进一步展开以下方面：\n\n${template}\n\n请确保回答尽可能详尽，包含完整的代码实现。`
            : template;

        this.promptIndex++;
        if (this.promptIndex >= category.templates.length) {
            this.promptIndex = 0;
            this.categoryIndex++;
        }

        return {
            payload: {
                messages: [
                    { role: 'system', content: category.system },
                    ...context.history.slice(-4), // 保留最近 2 轮对话
                    { role: 'user', content: userContent },
                ],
                model,
                maxTokens: 4096,
                temperature: 0.8,
            },
            estimatedTokens: this.estimateTokensPerCall(),
            suggestedDelayMs: 2000 + Math.random() * 3000, // 2~5s 短间隔
        };
    }

    getDelay(): number {
        return 2000 + Math.random() * 3000;
    }

    shouldContinue(consumed: number, target: number): boolean {
        return consumed < target;
    }
}
