/**
 * 话题路由 — 话题选择与自然切换逻辑
 */

import { DEFAULT_CONFIG } from '../config/default.js';

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 可用话题池
 */
const TOPIC_POOL = [
    { id: 'react-state', category: 'frontend', label: 'React 状态管理' },
    { id: 'vue-composition', category: 'frontend', label: 'Vue3 Composition API' },
    { id: 'css-layout', category: 'frontend', label: 'CSS 布局与响应式' },
    { id: 'nextjs-ssr', category: 'frontend', label: 'Next.js SSR/SSG' },
    { id: 'node-api', category: 'backend', label: 'Node.js API 设计' },
    { id: 'db-design', category: 'backend', label: '数据库设计与优化' },
    { id: 'auth-system', category: 'backend', label: '认证授权系统' },
    { id: 'microservice', category: 'backend', label: '微服务架构' },
    { id: 'docker-k8s', category: 'devops', label: 'Docker + K8s 部署' },
    { id: 'cicd-pipeline', category: 'devops', label: 'CI/CD 流水线' },
    { id: 'monitoring', category: 'devops', label: '监控告警体系' },
    { id: 'performance', category: 'optimize', label: '前端性能优化' },
    { id: 'api-perf', category: 'optimize', label: 'API 性能调优' },
    { id: 'ts-advanced', category: 'language', label: 'TypeScript 高级类型' },
    { id: 'testing', category: 'quality', label: '测试策略与实践' },
    { id: 'code-review', category: 'quality', label: '代码审查与重构' },
];

export interface TopicInfo {
    id: string;
    category: string;
    label: string;
}

export class TopicRouter {
    private usedTopics: Set<string> = new Set();
    private currentTopic: TopicInfo | null = null;
    private currentRounds = 0;

    /**
     * 获取当前话题
     */
    getCurrentTopic(): TopicInfo | null {
        return this.currentTopic;
    }

    /**
     * 选择下一个话题
     * 优先选择未使用过的话题，避免同类别连续出现
     */
    selectNextTopic(): TopicInfo {
        const currentCategory = this.currentTopic?.category;
        const available = TOPIC_POOL.filter(t =>
            !this.usedTopics.has(t.id) && t.category !== currentCategory
        );

        // 如果所有话题都用过，重置
        const pool = available.length > 0 ? available : TOPIC_POOL.filter(t => t.category !== currentCategory);
        if (pool.length === 0) {
            this.usedTopics.clear();
            return this.selectNextTopic();
        }

        const selected = pool[randomInt(0, pool.length - 1)]!;
        this.currentTopic = selected;
        this.currentRounds = 0;
        this.usedTopics.add(selected.id);

        return selected;
    }

    /**
     * 判断是否应该切换话题
     */
    shouldSwitchTopic(): boolean {
        if (!this.currentTopic) return true;

        const { min, max } = DEFAULT_CONFIG.camouflage.topicSwitchAfterRounds;
        const threshold = randomInt(min, max);
        return this.currentRounds >= threshold;
    }

    /**
     * 记录一轮对话完成
     */
    recordRound(): void {
        this.currentRounds++;
    }

    /**
     * 重置路由状态
     */
    reset(): void {
        this.usedTopics.clear();
        this.currentTopic = null;
        this.currentRounds = 0;
    }
}
