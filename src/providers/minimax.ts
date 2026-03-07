/**
 * MiniMax 直连 Provider
 * 使用 OpenAI 兼容接口
 */

import { BaseOpenAICompatibleProvider } from './openai.js';
import type { ModelInfo } from './base.js';

const MINIMAX_MODELS: ModelInfo[] = [
    { id: 'MiniMax-Text-01', name: 'MiniMax Text-01', maxTokens: 245760, pricing: { input: 0.20, output: 1.10 }, provider: 'MiniMax' },
    { id: 'abab6.5s-chat', name: 'ABAB 6.5s Chat', maxTokens: 8192, pricing: { input: 0.10, output: 0.10 }, provider: 'MiniMax' },
    { id: 'abab6.5-chat', name: 'ABAB 6.5 Chat', maxTokens: 8192, pricing: { input: 0.20, output: 0.20 }, provider: 'MiniMax' },
    { id: 'abab5.5s-chat', name: 'ABAB 5.5s Chat', maxTokens: 8192, pricing: { input: 0.005, output: 0.005 }, provider: 'MiniMax' },
];

export class MinimaxProvider extends BaseOpenAICompatibleProvider {
    readonly name = 'MiniMax';

    /**
     * @param apiKey MiniMax API Key
     * @param groupId MiniMax Group ID（可选，用于企业账号）
     */
    constructor(apiKey: string, groupId?: string) {
        super(
            apiKey,
            'https://api.minimax.chat/v1',
            groupId ? { 'GroupId': groupId } : undefined,
        );
    }

    override async listModels(): Promise<ModelInfo[]> {
        return MINIMAX_MODELS;
    }
}
