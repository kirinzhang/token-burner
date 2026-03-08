/**
 * Provider 工厂（OpenClaw 风格）
 *
 * 命名规范：provider/model（如 openai/gpt-4o、anthropic/claude-3-7-sonnet）
 *
 * 两类 Provider：
 *   1. Built-in：内置供应商，只需 API Key
 *   2. Custom：用户自定义 baseUrl + apiKey + models（OpenRouter/Ollama/代理等）
 */

import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';
import { GoogleProvider } from './google.js';
import { ZAIProvider } from './zai.js';
import { DeepSeekProvider } from './deepseek.js';
import { MoonshotProvider } from './moonshot.js';
import { MinimaxProvider } from './minimax.js';
import { CustomProvider, type CustomProviderConfig } from './custom.js';
import type { AIProvider } from './base.js';

// ── Built-in Provider 类型 ──────────────────────────────────────────────────
export type BuiltinProviderName =
    | 'openai'
    | 'anthropic'
    | 'google'
    | 'zai'        // Z.AI / GLM
    | 'deepseek'
    | 'moonshot'   // Kimi
    | 'minimax';

export type ProviderName = BuiltinProviderName | 'custom' | string; // custom:id 或直接 id

// ── 配置接口 ─────────────────────────────────────────────────────────────────
export interface ProviderConfig {
    /** 当前激活的 Provider（built-in id 或 custom provider 的 id） */
    activeProvider: string;

    // Built-in keys
    openai?: { apiKey: string };
    anthropic?: { apiKey: string };
    google?: { apiKey: string };
    zai?: { apiKey: string };
    deepseek?: { apiKey: string };
    moonshot?: { apiKey: string };
    minimax?: { apiKey: string; groupId?: string };

    /** 自定义 Provider 列表 */
    customProviders?: CustomProviderConfig[];

    /** 兼容旧版单 apiKey 字段 */
    apiKey?: string;
    baseUrl?: string;
    /** @deprecated 用 activeProvider */
    provider?: string;
    /** @deprecated 旧配置（openrouter 迁移为 custom provider） */
    openrouter?: { apiKey: string };
}

// ── Built-in Provider 元数据 ──────────────────────────────────────────────────
export interface ProviderMeta {
    label: string;
    icon: string;
    description: string;
    keysPage: string;
    envVar: string;
    exampleModel: string;
    hasOAuth: boolean;
    isBuiltin: true;
    fields: Array<{ key: string; label: string; placeholder: string }>;
}

export const BUILTIN_PROVIDER_META: Record<BuiltinProviderName, ProviderMeta> = {
    openai: {
        label: 'OpenAI',
        icon: '🤖',
        description: 'GPT-4o, o3-mini, o1...',
        keysPage: 'https://platform.openai.com/api-keys',
        envVar: 'OPENAI_API_KEY',
        exampleModel: 'openai/gpt-4o',
        hasOAuth: false,
        isBuiltin: true,
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'sk-...' }],
    },
    anthropic: {
        label: 'Anthropic',
        icon: '🔮',
        description: 'Claude 3.7 Sonnet, Claude Opus...',
        keysPage: 'https://console.anthropic.com/account/keys',
        envVar: 'ANTHROPIC_API_KEY',
        exampleModel: 'anthropic/claude-3-7-sonnet-20250219',
        hasOAuth: false,
        isBuiltin: true,
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'sk-ant-...' }],
    },
    google: {
        label: 'Google Gemini',
        icon: '🌏',
        description: 'Gemini 2.5 Pro, Flash, Flash-Lite...',
        keysPage: 'https://aistudio.google.com/app/apikey',
        envVar: 'GEMINI_API_KEY',
        exampleModel: 'google/gemini-2.0-flash',
        hasOAuth: false,
        isBuiltin: true,
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'AIza...' }],
    },
    zai: {
        label: 'Z.AI (GLM)',
        icon: '🧠',
        description: 'GLM-4 Flash（免费）, GLM-Z1 系列推理...',
        keysPage: 'https://open.bigmodel.cn/usercenter/apikeys',
        envVar: 'ZAI_API_KEY',
        exampleModel: 'zai/glm-4-flash',
        hasOAuth: false,
        isBuiltin: true,
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'ZAI_API_KEY...' }],
    },
    deepseek: {
        label: 'DeepSeek',
        icon: '🐋',
        description: 'DeepSeek R1（推理）, DeepSeek V3...',
        keysPage: 'https://platform.deepseek.com/api_keys',
        envVar: 'DEEPSEEK_API_KEY',
        exampleModel: 'deepseek/deepseek-reasoner',
        hasOAuth: false,
        isBuiltin: true,
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'sk-...' }],
    },
    moonshot: {
        label: 'Moonshot (Kimi)',
        icon: '🌙',
        description: 'Kimi K2, Kimi K2 Turbo 长上下文...',
        keysPage: 'https://platform.moonshot.ai/',
        envVar: 'MOONSHOT_API_KEY',
        exampleModel: 'moonshot/kimi-k2-0905-preview',
        hasOAuth: false,
        isBuiltin: true,
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'sk-...' }],
    },
    minimax: {
        label: 'MiniMax',
        icon: '🇨🇳',
        description: 'MiniMax-Text-01, ABAB 系列...',
        keysPage: 'https://platform.minimaxi.com/user-center/basic-information/interface-key',
        envVar: 'MINIMAX_API_KEY',
        exampleModel: 'minimax/MiniMax-Text-01',
        hasOAuth: false,
        isBuiltin: true,
        fields: [
            { key: 'apiKey', label: 'API Key', placeholder: 'eyJ...' },
            { key: 'groupId', label: 'Group ID（可选）', placeholder: '1234567890' },
        ],
    },
};

// 兼容旧 PROVIDER_META 引用（oauth.ts 用到）
export const PROVIDER_META = BUILTIN_PROVIDER_META;

// ── Provider 工厂 ─────────────────────────────────────────────────────────────
export class ProviderFactory {
    /**
     * 根据配置创建对应的 Provider 实例
     * activeProvider 可以是 built-in id 或 custom provider 的 id
     */
    static create(config: ProviderConfig): AIProvider {
        const p = config.activeProvider || 'openai';

        // 1. 先查找 custom provider
        const customConf = config.customProviders?.find(c => c.id === p);
        if (customConf) {
            return new CustomProvider(customConf);
        }

        // 2. 旧版 openrouter 迁移为 custom provider
        if (p === 'openrouter') {
            const key = config.openrouter?.apiKey || config.apiKey || '';
            if (!key) throw new Error('OpenRouter API Key 未配置');
            return new CustomProvider({
                id: 'openrouter',
                name: 'OpenRouter',
                baseUrl: 'https://openrouter.ai/api/v1',
                apiKey: key,
                autoFetchModels: true,
            });
        }

        // 3. Built-in providers
        switch (p as BuiltinProviderName) {
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
            case 'zai': {
                const key = config.zai?.apiKey || '';
                if (!key) throw new Error('Z.AI API Key 未配置');
                return new ZAIProvider(key);
            }
            case 'deepseek': {
                const key = config.deepseek?.apiKey || '';
                if (!key) throw new Error('DeepSeek API Key 未配置');
                return new DeepSeekProvider(key);
            }
            case 'moonshot': {
                const key = config.moonshot?.apiKey || '';
                if (!key) throw new Error('Moonshot API Key 未配置');
                return new MoonshotProvider(key);
            }
            case 'minimax': {
                const key = config.minimax?.apiKey || '';
                if (!key) throw new Error('MiniMax API Key 未配置');
                return new MinimaxProvider(key, config.minimax?.groupId);
            }
            default: {
                // 最终兜底：尝试用 legacy apiKey + baseUrl 创建 custom provider
                const key = config.apiKey || '';
                const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
                if (!key) throw new Error(`Provider "${p}" 未配置`);
                return new CustomProvider({ id: p, name: p, baseUrl, apiKey: key });
            }
        }
    }

    /** 返回所有 built-in provider 的 id 列表 */
    static builtinIds(): BuiltinProviderName[] {
        return Object.keys(BUILTIN_PROVIDER_META) as BuiltinProviderName[];
    }
}
