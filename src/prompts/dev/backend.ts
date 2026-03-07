/**
 * 后端开发类 Prompt 模板
 * API 设计、数据库、微服务、缓存
 */

import type { PromptTemplate } from './frontend.js';

export const BACKEND_PROMPTS: PromptTemplate[] = [
    {
        topic: 'API 设计',
        prompts: [
            '帮我设计一个 RESTful API 规范，包括 URL 命名、HTTP 方法使用、状态码、分页、筛选和错误格式',
            '如何设计一个 GraphQL Schema？对比 REST 和 GraphQL 在不同场景下的适用性，给出 N+1 问题的解决方案',
            '帮我设计一个 API 网关，支持路由、限流、鉴权、日志、灰度发布，用 Node.js 实现',
            '写一个 API 版本管理方案，对比 URL 路径、Header、Query 参数三种版本化方式的优劣',
            '帮我设计一个 Webhook 系统，支持事件订阅、重试机制、签名验证和日志记录',
        ],
    },
    {
        topic: '数据库优化',
        prompts: [
            '帮我分析 PostgreSQL 的索引类型（B-tree、Hash、GIN、GiST），各适用什么场景？',
            '如何设计一个高并发场景下的秒杀系统数据库方案？考虑库存扣减、防超卖和性能',
            '帮我写一个 PostgreSQL 慢查询排查清单，从 explain analyze 分析到索引优化的完整流程',
            '设计一个时序数据存储方案，对比 TimescaleDB、InfluxDB 和 ClickHouse 的特点',
            '帮我实现一个数据库迁移管理工具的核心逻辑，支持版本追踪、回滚和 seed 数据',
        ],
    },
    {
        topic: '微服务架构',
        prompts: [
            '帮我设计服务间通信方案，对比 REST、gRPC、消息队列，在不同场景下的选择标准',
            '如何实现分布式事务？对比 Saga、TCC、2PC 方案，给出 Node.js 下的 Saga 实现',
            '帮我设计一个服务注册与发现方案，对比 Consul、Eureka 和 K8s 原生方案',
            '微服务拆分原则是什么？帮我把一个单体电商系统拆分为微服务，画出架构图',
            '如何实现微服务的优雅降级和熔断器模式？用 TypeScript 实现一个简单的 Circuit Breaker',
        ],
    },
];
