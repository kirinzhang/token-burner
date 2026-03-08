/**
 * Provider 工厂（OpenClaw 风格）
 *
 * 命名规范：provider/model（如 openai/gpt-4o、anthropic/claude-3-7-sonnet）
 *
 * 三类 Provider：
 *   1. Built-in（显示在 UI）：内置供应商，只需 API Key
 *   2. Built-in（仅后台环境变量）：小众供应商（Doubao/BytePlus/Kilo），支持但不在 UI 展示
 *   3. Custom：用户自定义 baseUrl + apiKey + models
 */

import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';
import { GoogleProvider } from './google.js';
import { ZAIProvider } from './zai.js';
import { DeepSeekProvider } from './deepseek.js';
import { MoonshotProvider } from './moonshot.js';
import { MinimaxProvider } from './minimax.js';
import { OpenRouterProvider } from './openrouter.js';
import { XAIProvider } from './xai.js';
import { MistralProvider } from './mistral.js';
import { GroqProvider } from './groq.js';
import { CerebrasProvider } from './cerebras.js';
import { HuggingFaceProvider } from './huggingface.js';
import { OllamaProvider } from './ollama.js';
import { VLLMProvider } from './vllm.js';
import { CustomProvider, type CustomProviderConfig } from './custom.js';
import type { AIProvider } from './base.js';

// ── Built-in Provider 类型 ──────────────────────────────────────────────────
/** 在 UI 配置页展示的 built-in provider（主流 + 热门） */
export type BuiltinProviderName =
    | 'openai'
    | 'anthropic'
    | 'google'
    | 'openrouter'  // 升级为内置
    | 'zai'
    | 'deepseek'
    | 'moonshot'
    | 'minimax'
    | 'xai'
    | 'mistral'
    | 'groq'
    | 'cerebras'
    | 'huggingface'
    | 'ollama'
    | 'vllm';

export type ProviderName = BuiltinProviderName | 'custom' | string;

// ── 配置接口 ─────────────────────────────────────────────────────────────────
export interface ProviderConfig {
    activeProvider: string;

    // UI 显示的 Built-in
    openai?: { apiKey: string };
    anthropic?: { apiKey: string };
    google?: { apiKey: string };
    openrouter?: { apiKey: string };
    xai?: { apiKey: string };
    mistral?: { apiKey: string };
    groq?: { apiKey: string };
    cerebras?: { apiKey: string };
    huggingface?: { apiKey: string };
    zai?: { apiKey: string };
    deepseek?: { apiKey: string };
    moonshot?: { apiKey: string };
    minimax?: { apiKey: string; groupId?: string };
    ollama?: { baseUrl?: string };
    vllm?: { baseUrl?: string };

    // 小众 Provider（只从环境变量读取，不在 UI 展示）
    volcengine?: { apiKey: string };
    byteplus?: { apiKey: string };
    kilocode?: { apiKey: string };

    customProviders?: CustomProviderConfig[];

    // 兼容旧版
    apiKey?: string;
    baseUrl?: string;
    provider?: string;
}

// ── Built-in Provider 元数据（UI 展示） ─────────────────────────────────────
export interface ProviderMeta {
    label: string;
    icon: string;
    description: string;
    keysPage: string;
    envVar: string;
    exampleModel: string;
    hasOAuth: boolean;
    isBuiltin: true;
    /** 'apikey' | 'oauth' | 'none'（本地无需认证） */
    authType: 'apikey' | 'oauth' | 'none';
    /** UI 分组：'cloud'（主流云端）| 'cn'（国内）| 'local'（本地） */
    group: 'cloud' | 'cn' | 'local';
    fields: Array<{ key: string; label: string; placeholder: string }>;
}

export const BUILTIN_PROVIDER_META: Record<BuiltinProviderName, ProviderMeta> = {
    openai: {
        label: 'OpenAI',
        icon: '🤖',
        description: 'GPT-4o, o3, o4-mini...',
        keysPage: 'https://platform.openai.com/api-keys',
        envVar: 'OPENAI_API_KEY',
        exampleModel: 'openai/gpt-4o',
        hasOAuth: false,
        isBuiltin: true,
        authType: 'apikey',
        group: 'cloud',
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'sk-...' }],
    },
    anthropic: {
        label: 'Anthropic',
        icon: '🔮',
        description: 'Claude Opus 4, Sonnet 4.5...',
        keysPage: 'https://console.anthropic.com/account/keys',
        envVar: 'ANTHROPIC_API_KEY',
        exampleModel: 'anthropic/claude-3-7-sonnet-20250219',
        hasOAuth: false,
        isBuiltin: true,
        authType: 'apikey',
        group: 'cloud',
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'sk-ant-...' }],
    },
    google: {
        label: 'Google Gemini',
        icon: '✨',
        description: 'Gemini 2.5 Pro, 2.5 Flash... 免费额度大',
        keysPage: 'https://aistudio.google.com/app/apikey',
        envVar: 'GEMINI_API_KEY',
        exampleModel: 'google/gemini-2.0-flash',
        hasOAuth: true,
        isBuiltin: true,
        authType: 'oauth',
        group: 'cloud',
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'AIza...' }],
    },
    openrouter: {
        label: 'OpenRouter',
        icon: '🌐',
        description: '800+ 模型聚合，支持 OAuth 免注册使用',
        keysPage: 'https://openrouter.ai/keys',
        envVar: 'OPENROUTER_API_KEY',
        exampleModel: 'openrouter/anthropic/claude-sonnet-4-5',
        hasOAuth: true,
        isBuiltin: true,
        authType: 'oauth',
        group: 'cloud',
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'sk-or-...' }],
    },
    xai: {
        label: 'xAI (Grok)',
        icon: '⚡',
        description: 'Grok 3, Grok 3 Mini...',
        keysPage: 'https://console.x.ai/',
        envVar: 'XAI_API_KEY',
        exampleModel: 'xai/grok-3-mini',
        hasOAuth: false,
        isBuiltin: true,
        authType: 'apikey',
        group: 'cloud',
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'xai-...' }],
    },
    mistral: {
        label: 'Mistral AI',
        icon: '🌊',
        description: 'Mistral Large, Codestral...',
        keysPage: 'https://console.mistral.ai/api-keys/',
        envVar: 'MISTRAL_API_KEY',
        exampleModel: 'mistral/mistral-large-latest',
        hasOAuth: false,
        isBuiltin: true,
        authType: 'apikey',
        group: 'cloud',
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'api-key...' }],
    },
    groq: {
        label: 'Groq',
        icon: '🚀',
        description: '超高速推理，Llama 3.3 70B...',
        keysPage: 'https://console.groq.com/keys',
        envVar: 'GROQ_API_KEY',
        exampleModel: 'groq/llama-3.3-70b-versatile',
        hasOAuth: false,
        isBuiltin: true,
        authType: 'apikey',
        group: 'cloud',
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'gsk_...' }],
    },
    cerebras: {
        label: 'Cerebras',
        icon: '🧬',
        description: '超快推理芯片，Llama 3.3 70B...',
        keysPage: 'https://cloud.cerebras.ai/',
        envVar: 'CEREBRAS_API_KEY',
        exampleModel: 'cerebras/llama-3.3-70b',
        hasOAuth: false,
        isBuiltin: true,
        authType: 'apikey',
        group: 'cloud',
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'csk-...' }],
    },
    huggingface: {
        label: 'Hugging Face',
        icon: '🤗',
        description: 'DeepSeek-R1, Llama 3.3 70B...',
        keysPage: 'https://huggingface.co/settings/tokens',
        envVar: 'HF_TOKEN',
        exampleModel: 'huggingface/deepseek-ai/DeepSeek-R1',
        hasOAuth: false,
        isBuiltin: true,
        authType: 'apikey',
        group: 'cloud',
        fields: [{ key: 'apiKey', label: 'HF Token', placeholder: 'hf_...' }],
    },
    zai: {
        label: 'Z.AI (GLM)',
        icon: '🧠',
        description: 'GLM-4 Flash（免费）, GLM-Z1 推理...',
        keysPage: 'https://open.bigmodel.cn/usercenter/apikeys',
        envVar: 'ZAI_API_KEY',
        exampleModel: 'zai/glm-4-flash',
        hasOAuth: false,
        isBuiltin: true,
        authType: 'apikey',
        group: 'cn',
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
        authType: 'apikey',
        group: 'cn',
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'sk-...' }],
    },
    moonshot: {
        label: 'Moonshot (Kimi)',
        icon: '🌙',
        description: 'Kimi K2, 超长上下文 128K...',
        keysPage: 'https://platform.moonshot.ai/',
        envVar: 'MOONSHOT_API_KEY',
        exampleModel: 'moonshot/kimi-k2-0905-preview',
        hasOAuth: false,
        isBuiltin: true,
        authType: 'apikey',
        group: 'cn',
        fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'sk-...' }],
    },
    minimax: {
        label: 'MiniMax',
        icon: '🇨🇳',
        description: 'MiniMax-Text-01, 超大上下文 1M...',
        keysPage: 'https://platform.minimaxi.com/user-center/basic-information/interface-key',
        envVar: 'MINIMAX_API_KEY',
        exampleModel: 'minimax/MiniMax-Text-01',
        hasOAuth: false,
        isBuiltin: true,
        authType: 'apikey',
        group: 'cn',
        fields: [
            { key: 'apiKey', label: 'API Key', placeholder: 'eyJ...' },
            { key: 'groupId', label: 'Group ID（可选）', placeholder: '1234567890' },
        ],
    },
    ollama: {
        label: 'Ollama',
        icon: '🦙',
        description: '本地运行，自动发现已安装模型',
        keysPage: 'https://ollama.ai',
        envVar: '',
        exampleModel: 'ollama/llama3.2',
        hasOAuth: false,
        isBuiltin: true,
        authType: 'none',
        group: 'local',
        fields: [{ key: 'baseUrl', label: 'Base URL', placeholder: 'http://127.0.0.1:11434/v1' }],
    },
    vllm: {
        label: 'vLLM',
        icon: '⚙️',
        description: '本地 vLLM 服务，自动发现加载的模型',
        keysPage: 'https://docs.vllm.ai',
        envVar: '',
        exampleModel: 'vllm/local-model',
        hasOAuth: false,
        isBuiltin: true,
        authType: 'none',
        group: 'local',
        fields: [{ key: 'baseUrl', label: 'Base URL', placeholder: 'http://127.0.0.1:8000/v1' }],
    },
};

// 兼容旧引用
export const PROVIDER_META = BUILTIN_PROVIDER_META;

// ── Provider 工厂 ─────────────────────────────────────────────────────────────
export class ProviderFactory {
    static create(config: ProviderConfig): AIProvider {
        const p = config.activeProvider || 'openai';

        // 1. 先查找 custom provider
        const customConf = config.customProviders?.find(c => c.id === p);
        if (customConf) {
            return new CustomProvider(customConf);
        }

        // 2. Built-in providers
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
                if (!key) throw new Error('Google Gemini API Key 未配置');
                return new GoogleProvider(key);
            }
            case 'openrouter': {
                const key = config.openrouter?.apiKey || '';
                if (!key) throw new Error('OpenRouter API Key 未配置');
                return new OpenRouterProvider(key);
            }
            case 'xai': {
                const key = config.xai?.apiKey || '';
                if (!key) throw new Error('xAI API Key 未配置');
                return new XAIProvider(key);
            }
            case 'mistral': {
                const key = config.mistral?.apiKey || '';
                if (!key) throw new Error('Mistral API Key 未配置');
                return new MistralProvider(key);
            }
            case 'groq': {
                const key = config.groq?.apiKey || '';
                if (!key) throw new Error('Groq API Key 未配置');
                return new GroqProvider(key);
            }
            case 'cerebras': {
                const key = config.cerebras?.apiKey || '';
                if (!key) throw new Error('Cerebras API Key 未配置');
                return new CerebrasProvider(key);
            }
            case 'huggingface': {
                const key = config.huggingface?.apiKey || '';
                if (!key) throw new Error('HuggingFace Token 未配置');
                return new HuggingFaceProvider(key);
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
            case 'ollama': {
                return new OllamaProvider(config.ollama?.baseUrl);
            }
            case 'vllm': {
                return new VLLMProvider(config.vllm?.baseUrl);
            }
            default: {
                const key = config.apiKey || '';
                const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
                if (!key) throw new Error(`Provider "${p}" 未配置`);
                return new CustomProvider({ id: p, name: p, baseUrl, apiKey: key });
            }
        }
    }

    static builtinIds(): BuiltinProviderName[] {
        return Object.keys(BUILTIN_PROVIDER_META) as BuiltinProviderName[];
    }

    /** 按 group 分组返回 built-in provider 元数据 */
    static builtinByGroup(): Record<'cloud' | 'cn' | 'local', Array<{ id: BuiltinProviderName } & ProviderMeta>> {
        const result = { cloud: [] as Array<{ id: BuiltinProviderName } & ProviderMeta>, cn: [] as Array<{ id: BuiltinProviderName } & ProviderMeta>, local: [] as Array<{ id: BuiltinProviderName } & ProviderMeta> };
        for (const [id, meta] of Object.entries(BUILTIN_PROVIDER_META) as [BuiltinProviderName, ProviderMeta][]) {
            result[meta.group].push({ id, ...meta });
        }
        return result;
    }
}
