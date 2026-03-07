/**
 * 多轮对话链模板
 * 预定义的对话序列，模拟真实工作中的追问模式
 */

export interface ConversationChain {
    topic: string;
    category: string;
    messages: string[];
}

export const CONVERSATION_CHAINS: ConversationChain[] = [
    {
        topic: '重构遗留代码',
        category: 'refactoring',
        messages: [
            '我们项目有一个 800 行的 utils.js 文件，里面混了各种工具函数，帮我制定一个拆分重构方案',
            '拆分后这些工具函数的测试策略怎么定？之前完全没有测试',
            '有些工具函数被 20+ 个文件引用了，重构时怎么避免改出 bug？',
            '重构完成后怎么验证没有引入回归问题？有什么自动化验证手段？',
        ],
    },
    {
        topic: '技术选型讨论',
        category: 'architecture',
        messages: [
            '我们要做一个新项目的技术选型，前端在 Next.js 和 Remix 之间犹豫，帮我分析对比',
            '状态管理方面，团队之前用 Redux，但觉得太重了。Zustand 和 Jotai 哪个更适合中型项目？',
            '后端打算用 Node.js，但有人建议 Go，考虑到团队学习成本和项目特点帮我分析',
            '数据库选型：PostgreSQL vs MySQL 8.0，我们的场景是读多写少的内容管理系统',
        ],
    },
    {
        topic: 'Code Review',
        category: 'code-review',
        messages: [
            '帮我 review 这段 React 代码的设计模式是否合理，特别是状态提升和 Context 的使用',
            '这段代码的错误处理不够完善，帮我列出需要补充的异常处理场景',
            '从可测试性角度帮我分析这段代码，哪些地方需要用依赖注入改造？',
            '性能方面有什么隐患？特别关注不必要的重渲染和内存泄漏风险',
        ],
    },
    {
        topic: '线上故障复盘',
        category: 'incident',
        messages: [
            '昨晚线上出了一个 P1 故障，用户反馈下单后库存没有扣减，帮我分析可能的原因',
            '查到是并发导致的超卖问题，帮我设计一个防超卖方案，考虑分布式锁和乐观锁',
            '修复方案确定了，帮我写一个上线 checklist 和回滚方案',
            '故障解决了，帮我写一份 Postmortem 报告模板，包括时间线、根因、改进措施',
        ],
    },
    {
        topic: '新人 Onboarding',
        category: 'onboarding',
        messages: [
            '团队来了一个新人，帮我整理一份前端项目的 Onboarding 文档大纲',
            '新人需要了解我们的 Git 工作流（feature branch + squash merge），帮我写个操作指南',
            '帮我列一个新人代码规范 checklist，包括命名规范、文件组织、注释规范',
            '新人第一个任务是修一个简单的 CSS bug，帮我写一下「从领任务到提交 PR 的完整流程」',
        ],
    },
];

/**
 * 随机选择一个对话链
 */
export function getRandomChain(): ConversationChain {
    return CONVERSATION_CHAINS[Math.floor(Math.random() * CONVERSATION_CHAINS.length)]!;
}
