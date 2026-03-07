/**
 * AI Provider 接口定义
 * 所有 Provider 适配器需实现此接口
 */

export interface ModelInfo {
    id: string;
    name: string;
    maxTokens: number;
    pricing: {
        input: number;  // $/1M tokens
        output: number; // $/1M tokens
    };
}

export interface PromptPayload {
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    model: string;
    maxTokens?: number;
    temperature?: number;
}

export interface ConsumeResult {
    content: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    model: string;
    durationMs: number;
}

export interface AIProvider {
    readonly name: string;

    /** 列出所有可用模型及价格 */
    listModels(): Promise<ModelInfo[]>;

    /** 发送消息并返回消耗结果 */
    sendMessage(payload: PromptPayload): Promise<ConsumeResult>;

    /** 获取指定模型的单 Token 价格 */
    getCostPerToken(model: string): { input: number; output: number };

    /** 检查连接是否可用（含 API Key 校验） */
    testConnection(): Promise<boolean>;
}
