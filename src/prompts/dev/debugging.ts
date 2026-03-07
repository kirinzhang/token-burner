/**
 * 调试排查类 Prompt 模板
 * 错误排查、性能调优、故障诊断
 */

import type { PromptTemplate } from './frontend.js';

export const DEBUGGING_PROMPTS: PromptTemplate[] = [
    {
        topic: '错误排查',
        prompts: [
            '我的 React 应用出现了 "Maximum update depth exceeded" 错误，帮我分析所有可能的原因和解决方案',
            'Node.js 服务内存持续增长（可能有内存泄漏），帮我写一个排查流程，包括 heapdump 分析',
            '我的 API 接口偶尔返回 502，但日志里没有错误信息，帮我列出所有可能的排查方向',
            '前端页面在 Safari 上布局错乱但 Chrome 正常，帮我分析常见的兼容性问题和调试方法',
            'Next.js SSR 页面 hydration mismatch 报错，帮我分析原因和最佳解决方案',
        ],
    },
    {
        topic: '性能调优',
        prompts: [
            '我的 Node.js 接口 P99 延迟达到 2s，帮我写一个从代码到基础设施的全链路性能排查方案',
            'React 应用在低端 Android 设备上卡顿严重，帮我制定一个「性能 budget」和优化路线图',
            'PostgreSQL 查询在数据量增长到 100 万行后变慢了 10 倍，帮我分析索引和查询优化方案',
            '我的 WebSocket 服务在连接数超过 5000 时开始丢消息，帮我分析可能原因和优化方案',
            '前端 bundle 大小 2MB+，帮我做一个完整的 bundle 分析和优化方案（含 code splitting 策略）',
        ],
    },
];
