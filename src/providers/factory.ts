/**
 * Provider 工厂
 * 根据配置的 activeProvider 返回对应 Provider 实例
 */

import { OpenAIProvider } from './openai.js';
import { OpenRouterProvider } from './openrouter.js';
import { AnthropicProvider } from './anthropic.js';
import { GoogleProvider } from './google.js';
import { MinimaxProvider } from './minimax.js';
import { GLMProvider } from './glm.js';
import { DeepSeekProvider } from './deepseek.js';
import type { AIProvider } from './base.js';

export type ProviderName =
    | 'openrouter'
    | 'openai'
    | 'anthropic'
    | 'google'
    | 'minimax'
    | 'glm'
    | 'deepseek';

export interface ProviderConfig {
    activeProvider: ProviderName;
    openrouter?: { apiKey: string };
    openai?: { apiKey: string };
    anthropic?: { apiKey: string };
    google?: { apiKey: string };
    minimax?: { apiKey: string; groupId?: string };
    glm?: { apiKey: string };
    deepseek?: { apiKey: string };
    // 兼容旧版单 apiKey 字段
    apiKey?: string;
    baseUrl?: string;
}

/** Provider 元数据（用于 UI 展示） */
export const PROVIDER_META: Record<ProviderName, {
    label: string;
    icon: string;
    description: string;
    keysPage: string;
    hasOAuth: boolean;
    fields: Array<{ key: string; label: string; placeholder: string; type?: string }>;
}> = {
    openrouter: {
        label: 'OpenRouter',
        icon: '🌐',
        description: '一个 Key 访问 800+ 模型 / 40+ 供应商',
        keysPage: 'https://openrouter.ai/keys',
        hasOAuth: true,
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'sk-or-...' }],
    },
    openai: {
        label: 'OpenAI',
        icon: '🤖',
        description: 'GPT-4o, GPT-4o mini, o1, o3...',
        keysPage: 'https://platform.openai.com/api-keys',
        hasOAuth: false,
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'sk-...' }],
    },
    anthropic: {
        label: 'Anthropic',
        icon: '🔮',
        description: 'Claude 3.7 Sonnet, Claude 3.5, Opus...',
        keysPage: 'https://console.anthropic.com/account/keys',
        hasOAuth: false,
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'sk-ant-...' }],
    },
    google: {
        label: 'Google Gemini',
        icon: '🌏',
        description: 'Gemini 2.0 Flash, 2.0 Pro, 1.5 Pro...',
        keysPage: 'https://aistudio.google.com/app/apikey',
        hasOAuth: false,
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'AIza...' }],
    },
    minimax: {
        label: 'MiniMax',
        icon: '🇨🇳',
        description: 'MiniMax-Text-01, ABAB 系列...',
        keysPage: 'https://platform.minimaxi.com/user-center/basic-information/interface-key',
        hasOAuth: false,
        fields: [
            { key: 'apiKey', label: 'API Key', placeholder: 'eyJ...' },
            { key: 'groupId', label: 'Group ID（可选）', placeholder: '1234567890' },
        ],
    },
    glm: {
        label: 'GLM（智谱）',
        icon: '🧠',
        description: 'GLM-4-Flash（免费）, GLM-4-Air, GLM-Z1 系列...',
        keysPage: 'https://open.bigmodel.cn/usercenter/apikeys',
        hasOAuth: false,
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'YOUR_GLM_KEY' }],
    },
    deepseek: {
        label: 'DeepSeek',
        icon: '🚀',
        description: 'DeepSeek R1（推理）, DeepSeek V3...',
        keysPage: 'https://platform.deepseek.com/api_keys',
        hasOAuth: false,
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'sk-...' }],
    },
};

export class ProviderFactory {
    /**
     * 根据配置创建对应的 Provider 实例
     * fallback：config.apiKey + config.baseUrl（兼容旧版）
     */
    static create(config: ProviderConfig): AIProvider {
        const p = config.activeProvider ?? 'openai';

        switch (p) {
            case 'openrouter': {
                const key = config.openrouter?.apiKey || config.apiKey || '';
                if (!key) throw new Error('OpenRouter API Key 未配置');
                return new OpenRouterProvider(key);
            }
            case 'openai': {
                const key = config.openai?.apiKey || config.apiKey || '';
                if (!key) throw new Error('OpenAI API Key 未配置');
                return new OpenAIProvider(key);
            }
            case 'anthropic': {
                const key = config.anthropic?.apiKey || '';
                if (!key) throw new Error('Anthropic API Key 未配置');
                return new AnthropicProvider(key);
            }
            case 'google': {
                const key = config.google?.apiKey || '';
                if (!key) throw new Error('Google API Key 未配置');
                return new GoogleProvider(key);
            }
            case 'minimax': {
                const key = config.minimax?.apiKey || '';
                if (!key) throw new Error('MiniMax API Key 未配置');
                return new MinimaxProvider(key, config.minimax?.groupId);
            }
            case 'glm': {
                const key = config.glm?.apiKey || '';
                if (!key) throw new Error('GLM API Key 未配置');
                return new GLMProvider(key);
            }
            case 'deepseek': {
                const key = config.deepseek?.apiKey || '';
                if (!key) throw new Error('DeepSeek API Key 未配置');
                return new DeepSeekProvider(key);
            }
            default: {
                // 兜底：OpenAI 兼容
                const key = config.apiKey || '';
                if (!key) throw new Error('API Key 未配置');
                return new OpenAIProvider(key);
            }
        }
    }
}
