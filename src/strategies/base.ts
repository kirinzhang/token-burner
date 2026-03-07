/**
 * 策略基类/接口定义
 * 所有消耗策略需实现 BurnStrategy 接口
 */

import type { PromptPayload } from '../providers/base.js';

/**
 * 对话上下文 — 维护多轮对话的连贯性
 */
export interface ConversationContext {
    /** 当前话题 */
    topic: string;
    /** 子话题 */
    subTopic: string;
    /** 项目背景描述 */
    projectContext: string;
    /** 历史消息摘要 */
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
    /** 当前话题已进行的轮次 */
    roundCount: number;
    /** 总轮次计数 */
    totalRounds: number;
}

/**
 * 策略执行结果
 */
export interface StrategyResult {
    payload: PromptPayload;
    /** 预估本次消耗的 Token 数 */
    estimatedTokens: number;
    /** 建议的下次调用延迟（ms） */
    suggestedDelayMs: number;
}

/**
 * 消耗策略接口
 */
export interface BurnStrategy {
    /** 策略名称 */
    readonly name: string;
    /** 策略描述 */
    readonly description: string;
    /** 策略图标 */
    readonly icon: string;

    /** 预估单次消耗的 Token 数 */
    estimateTokensPerCall(): number;

    /** 根据上下文生成下一个 Prompt */
    generatePrompt(context: ConversationContext, model: string): StrategyResult;

    /** 获取调用间隔（ms） */
    getDelay(): number;

    /** 判断是否应继续消耗 */
    shouldContinue(consumed: number, target: number): boolean;
}

/**
 * 创建初始对话上下文
 */
export function createInitialContext(): ConversationContext {
    return {
        topic: '',
        subTopic: '',
        projectContext: '',
        history: [],
        roundCount: 0,
        totalRounds: 0,
    };
}
