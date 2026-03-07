/**
 * 多轮对话模拟器 — 管理对话上下文和连贯性
 */

import type { ConversationContext } from '../strategies/base.js';
import type { ConsumeResult } from '../providers/base.js';

/**
 * 对话模拟器
 * 负责维护对话上下文、历史记录，控制对话的连贯性
 */
export class ConversationSimulator {
    private contexts: Map<string, ConversationContext> = new Map();

    /**
     * 获取或创建指定话题的对话上下文
     */
    getContext(topic: string): ConversationContext {
        if (!this.contexts.has(topic)) {
            this.contexts.set(topic, {
                topic,
                subTopic: '',
                projectContext: '',
                history: [],
                roundCount: 0,
                totalRounds: 0,
            });
        }
        return this.contexts.get(topic)!;
    }

    /**
     * 获取当前活跃上下文（没有则创建默认）
     */
    getCurrentContext(): ConversationContext {
        if (this.contexts.size === 0) {
            return this.getContext('general');
        }
        // 返回最后一个活跃上下文
        const entries = [...this.contexts.entries()];
        return entries[entries.length - 1]![1];
    }

    /**
     * 更新对话上下文（在 API 调用后调用）
     */
    updateContext(
        context: ConversationContext,
        userMessage: string,
        result: ConsumeResult
    ): void {
        // 添加到历史
        context.history.push(
            { role: 'user', content: userMessage },
            { role: 'assistant', content: result.content }
        );

        // 限制历史长度，避免上下文过长
        const MAX_HISTORY = 10;
        if (context.history.length > MAX_HISTORY) {
            context.history = context.history.slice(-MAX_HISTORY);
        }

        context.roundCount++;
        context.totalRounds++;
    }

    /**
     * 切换到新话题，重置上下文
     */
    switchTopic(newTopic: string): ConversationContext {
        return this.getContext(newTopic);
    }

    /**
     * 清除所有上下文
     */
    reset(): void {
        this.contexts.clear();
    }

    /**
     * 获取统计信息
     */
    getStats(): { totalTopics: number; totalRounds: number } {
        let totalRounds = 0;
        for (const ctx of this.contexts.values()) {
            totalRounds += ctx.totalRounds;
        }
        return { totalTopics: this.contexts.size, totalRounds };
    }
}
