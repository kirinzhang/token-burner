/**
 * 自然模式策略
 * 模拟真实多轮对话，随机主题切换，间隔随机化
 */

import type { BurnStrategy, ConversationContext, StrategyResult } from './base.js';
import { DEFAULT_CONFIG } from '../config/default.js';

/**
 * 自然对话场景库
 * 模拟真实开发者的日常对话模式
 */
const CONVERSATION_SCENARIOS = [
    {
        topic: 'React 状态管理',
        chain: [
            '我在做一个电商项目的购物车模块，用 React + TypeScript，帮我设计组件结构和状态管理方案',
            '这个方案不错，但如果商品有多规格（SKU选择）的话，状态应该怎么设计？',
            '好的。现在帮我写一下添加商品到购物车的核心逻辑，需要处理：数量限制、库存校验、重复添加合并',
            '如果要支持优惠券叠加计算，购物车的价格计算逻辑怎么写？考虑满减、折扣、会员价',
            '帮我写一下购物车列表组件，要求虚拟滚动（列表可能有几百个SKU），用 React.memo 优化',
        ],
    },
    {
        topic: 'Node.js API 设计',
        chain: [
            '帮我设计一个用户权限系统的数据库 Schema，支持 RBAC 模型，用 PostgreSQL',
            '基于这个 Schema，帮我写 CRUD 接口，用 Express + TypeORM，包含参数校验和错误处理',
            '我需要加一个接口级别的权限中间件，怎么设计比较优雅？要支持路由级和方法级的权限控制',
            '如何给这套权限系统加上缓存？用 Redis 缓存角色权限映射，需要考虑缓存一致性',
            '帮我写这套权限系统的单元测试，用 Jest + supertest，覆盖正常和异常场景',
        ],
    },
    {
        topic: 'DevOps 部署',
        chain: [
            '我有一个 Next.js 项目需要容器化部署到 K8s，帮我写 Dockerfile，要求多阶段构建优化镜像大小',
            '现在帮我写 Kubernetes 部署配置，包括 Deployment、Service、Ingress，要求支持健康检查',
            '如何配置 HPA 自动伸缩？流量高峰时自动扩容，低谷时缩容，给出合理的阈值建议',
            '我需要加一个 GitHub Actions CI/CD 流程，push 到 main 分支自动部署到 K8s',
            '生产环境的日志和监控怎么搭建？Prometheus + Grafana 的配置方案',
        ],
    },
    {
        topic: '性能优化',
        chain: [
            '我的 React 应用首屏加载要 8 秒，帮我分析可能的性能瓶颈和优化方案',
            '代码层面的优化说一下，React.memo、useMemo、useCallback 的最佳实践是什么？什么时候不该用？',
            '我的列表组件渲染 1000 条数据时很卡，除了虚拟滚动还有什么优化手段？',
            'webpack 构建产物太大了，帮我分析 bundle 优化方案，包括 code splitting 和 tree shaking 配置',
            '帮我写一个前端性能监控 SDK，采集 FCP、LCP、FID、CLS 等 Web Vitals 指标',
        ],
    },
    {
        topic: '数据库设计',
        chain: [
            '帮我设计一个社交平台的数据库 Schema，用户可以发帖、评论、点赞、关注，用 PostgreSQL',
            '这个社交平台需要实现 Feed 流，帮我设计推拉结合的 Feed 架构',
            '关注关系查询在用户量大时会很慢，帮我优化查询方案，考虑索引和分页',
            '如果要加全文搜索功能，搜索帖子和用户，PostgreSQL 的全文搜索够用吗？还是需要 Elasticsearch？',
            '帮我设计数据库的分库分表方案，预计用户量 1000 万，日活 100 万',
        ],
    },
    {
        topic: 'TypeScript 高级类型',
        chain: [
            '帮我解释 TypeScript 的条件类型和 infer 关键字，给几个实际应用场景',
            '如何用 TypeScript 实现一个类型安全的事件系统？要求事件名和参数有完整的类型推断',
            '帮我写一个 TypeScript 的 DeepPartial 和 DeepRequired 工具类型，要支持嵌套对象和数组',
            '如何使用模板字面量类型实现类型安全的 CSS-in-JS 方案？',
            '帮我实现一个类型安全的 API Client 生成器，根据 OpenAPI Schema 自动推断请求和响应类型',
        ],
    },
];

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class NaturalStrategy implements BurnStrategy {
    readonly name = 'natural';
    readonly description = '自然模式 — 模拟真实多轮对话，随机主题切换';
    readonly icon = '📚';

    private scenarioIndex = randomInt(0, CONVERSATION_SCENARIOS.length - 1);
    private chainIndex = 0;

    estimateTokensPerCall(): number {
        // 自然模式每次消耗 1500~3000 Token
        return 2000;
    }

    generatePrompt(context: ConversationContext, model: string): StrategyResult {
        const scenario = CONVERSATION_SCENARIOS[this.scenarioIndex % CONVERSATION_SCENARIOS.length]!;
        const prompt = scenario.chain[this.chainIndex % scenario.chain.length]!;

        // 更新上下文
        context.topic = scenario.topic;
        context.roundCount++;
        context.totalRounds++;

        this.chainIndex++;

        // 当前话题已完成或达到随机轮次，切换话题
        const shouldSwitch = this.chainIndex >= scenario.chain.length ||
            context.roundCount >= randomInt(
                DEFAULT_CONFIG.camouflage.topicSwitchAfterRounds.min,
                DEFAULT_CONFIG.camouflage.topicSwitchAfterRounds.max
            );

        if (shouldSwitch) {
            this.scenarioIndex = randomInt(0, CONVERSATION_SCENARIOS.length - 1);
            this.chainIndex = 0;
            context.roundCount = 0;
            context.history = []; // 清空历史，开始新话题
        }

        return {
            payload: {
                messages: [
                    {
                        role: 'system',
                        content: '你是一位经验丰富的高级开发工程师，擅长全栈开发。请用中文回答，给出详细的技术分析和代码示例。回答要有深度，体现实际工作经验。',
                    },
                    ...context.history.slice(-6), // 保留最近 3 轮对话
                    { role: 'user', content: prompt },
                ],
                model,
                maxTokens: 2048,
                temperature: 0.7,
            },
            estimatedTokens: this.estimateTokensPerCall(),
            suggestedDelayMs: this.getDelay(),
        };
    }

    getDelay(): number {
        const { minDelayMs, maxDelayMs } = DEFAULT_CONFIG.camouflage;
        // 模拟人类思考+编码时间，30s~5min 随机
        return randomInt(minDelayMs, maxDelayMs);
    }

    shouldContinue(consumed: number, target: number): boolean {
        return consumed < target;
    }
}
