/**
 * 所有 built-in Provider 的静态模型数据
 * 无任何外部依赖（不 import OpenAI SDK、不做网络请求）
 * 仅供 /api/models 路由使用，保证瞬时返回
 */

export interface StaticModelInfo {
    id: string;       // provider/model-id 格式，如 openai/gpt-4o
    name: string;     // 显示名称
    provider: string; // provider 标识
    input: number;    // 每 1M token 输入费用（USD）
    output: number;   // 每 1M token 输出费用（USD）
}

const ALL_MODELS: StaticModelInfo[] = [
    // ── OpenAI ────────────────────────────────────────────────────────────────
    { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openai', input: 2.5, output: 10 },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o mini', provider: 'openai', input: 0.15, output: 0.6 },
    { id: 'openai/gpt-4.1', name: 'GPT-4.1', provider: 'openai', input: 2, output: 8 },
    { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 mini', provider: 'openai', input: 0.4, output: 1.6 },
    { id: 'openai/o3-mini', name: 'o3-mini', provider: 'openai', input: 1.1, output: 4.4 },
    { id: 'openai/o4-mini', name: 'o4-mini', provider: 'openai', input: 1.1, output: 4.4 },
    { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', input: 10, output: 30 },

    // ── Anthropic ─────────────────────────────────────────────────────────────
    { id: 'anthropic/claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', provider: 'anthropic', input: 3, output: 15 },
    { id: 'anthropic/claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', input: 3, output: 15 },
    { id: 'anthropic/claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'anthropic', input: 0.8, output: 4 },
    { id: 'anthropic/claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', input: 15, output: 75 },

    // ── Google Gemini ─────────────────────────────────────────────────────────
    { id: 'google/gemini-2.5-pro-exp-03-25', name: 'Gemini 2.5 Pro (Exp)', provider: 'google', input: 0, output: 0 },
    { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', input: 0.1, output: 0.4 },
    { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Exp (免费)', provider: 'google', input: 0, output: 0 },
    { id: 'google/gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', input: 1.25, output: 5 },
    { id: 'google/gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google', input: 0.075, output: 0.3 },
    { id: 'google/gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', provider: 'google', input: 0.0375, output: 0.15 },

    // ── OpenRouter (热门模型) ──────────────────────────────────────────────────
    { id: 'openrouter/openai/gpt-4o', name: '[OpenRouter] GPT-4o', provider: 'openrouter', input: 2.5, output: 10 },
    { id: 'openrouter/anthropic/claude-3.7-sonnet', name: '[OpenRouter] Claude 3.7 Sonnet', provider: 'openrouter', input: 3, output: 15 },
    { id: 'openrouter/google/gemini-2.0-flash-001', name: '[OpenRouter] Gemini 2.0 Flash', provider: 'openrouter', input: 0.1, output: 0.4 },
    { id: 'openrouter/deepseek/deepseek-r1', name: '[OpenRouter] DeepSeek R1', provider: 'openrouter', input: 0.55, output: 2.19 },
    { id: 'openrouter/meta-llama/llama-3.3-70b-instruct', name: '[OpenRouter] Llama 3.3 70B', provider: 'openrouter', input: 0.12, output: 0.3 },
    { id: 'openrouter/qwen/qwen-2.5-72b-instruct', name: '[OpenRouter] Qwen 2.5 72B', provider: 'openrouter', input: 0.35, output: 0.4 },
    { id: 'openrouter/mistralai/mistral-small-3.1-24b-instruct', name: '[OpenRouter] Mistral Small 3.1', provider: 'openrouter', input: 0.1, output: 0.3 },
    { id: 'openrouter/x-ai/grok-2-vision-1212', name: '[OpenRouter] Grok 2', provider: 'openrouter', input: 2, output: 10 },
    { id: 'openrouter/cohere/command-r-plus-08-2024', name: '[OpenRouter] Command R+', provider: 'openrouter', input: 2.5, output: 10 },
    { id: 'openrouter/nvidia/llama-3.1-nemotron-ultra-253b-v1', name: '[OpenRouter] Nemotron Ultra 253B (免费)', provider: 'openrouter', input: 0, output: 0 },

    // ── xAI (Grok) ──────────────────────────────────────────────────────────
    { id: 'xai/grok-3', name: 'Grok 3', provider: 'xai', input: 3, output: 15 },
    { id: 'xai/grok-3-mini', name: 'Grok 3 Mini', provider: 'xai', input: 0.3, output: 0.5 },
    { id: 'xai/grok-2-1212', name: 'Grok 2', provider: 'xai', input: 2, output: 10 },

    // ── Mistral ──────────────────────────────────────────────────────────────
    { id: 'mistral/mistral-large-latest', name: 'Mistral Large', provider: 'mistral', input: 2, output: 6 },
    { id: 'mistral/mistral-small-latest', name: 'Mistral Small 3.1', provider: 'mistral', input: 0.1, output: 0.3 },
    { id: 'mistral/codestral-latest', name: 'Codestral', provider: 'mistral', input: 0.3, output: 0.9 },
    { id: 'mistral/open-mistral-nemo', name: 'Mistral Nemo', provider: 'mistral', input: 0.15, output: 0.15 },

    // ── Groq ─────────────────────────────────────────────────────────────────
    { id: 'groq/llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq)', provider: 'groq', input: 0.59, output: 0.79 },
    { id: 'groq/llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', provider: 'groq', input: 0.05, output: 0.08 },
    { id: 'groq/mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'groq', input: 0.24, output: 0.24 },
    { id: 'groq/gemma2-9b-it', name: 'Gemma 2 9B (Groq)', provider: 'groq', input: 0.2, output: 0.2 },

    // ── Cerebras ─────────────────────────────────────────────────────────────
    { id: 'cerebras/llama-3.3-70b', name: 'Llama 3.3 70B (Cerebras)', provider: 'cerebras', input: 0.6, output: 0.6 },
    { id: 'cerebras/llama-3.1-8b', name: 'Llama 3.1 8B (Cerebras)', provider: 'cerebras', input: 0.1, output: 0.1 },

    // ── HuggingFace ──────────────────────────────────────────────────────────
    { id: 'huggingface/deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1 (HF)', provider: 'huggingface', input: 0.55, output: 2.19 },
    { id: 'huggingface/meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B (HF)', provider: 'huggingface', input: 0.12, output: 0.3 },
    { id: 'huggingface/Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B (HF)', provider: 'huggingface', input: 0.35, output: 0.4 },

    // ── Z.AI (GLM) ───────────────────────────────────────────────────────────
    { id: 'zai/glm-4-flash', name: 'GLM-4 Flash (免费)', provider: 'zai', input: 0, output: 0 },
    { id: 'zai/glm-4-plus', name: 'GLM-4 Plus', provider: 'zai', input: 0.07, output: 0.07 },
    { id: 'zai/glm-z1-flash', name: 'GLM-Z1 Flash (免费)', provider: 'zai', input: 0, output: 0 },
    { id: 'zai/glm-z1-air', name: 'GLM-Z1 Air', provider: 'zai', input: 0.07, output: 0.07 },
    { id: 'zai/glm-4-long', name: 'GLM-4 Long（128K 上下文）', provider: 'zai', input: 0, output: 0 },

    // ── DeepSeek ─────────────────────────────────────────────────────────────
    { id: 'deepseek/deepseek-reasoner', name: 'DeepSeek R1 (推理)', provider: 'deepseek', input: 0.55, output: 2.19 },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', provider: 'deepseek', input: 0.27, output: 1.1 },

    // ── Moonshot (Kimi) ──────────────────────────────────────────────────────
    { id: 'moonshot/kimi-k2', name: 'Kimi K2', provider: 'moonshot', input: 0.15, output: 0.6 },
    { id: 'moonshot/moonshot-v1-8k', name: 'Moonshot 8K', provider: 'moonshot', input: 0.15, output: 0.15 },
    { id: 'moonshot/moonshot-v1-32k', name: 'Moonshot 32K', provider: 'moonshot', input: 0.2, output: 0.2 },
    { id: 'moonshot/moonshot-v1-128k', name: 'Moonshot 128K', provider: 'moonshot', input: 0.6, output: 0.6 },

    // ── MiniMax ──────────────────────────────────────────────────────────────
    { id: 'minimax/minimax-text-01', name: 'MiniMax Text-01', provider: 'minimax', input: 0.1, output: 0.55 },
    { id: 'minimax/abab6.5s-chat', name: 'ABAB 6.5s', provider: 'minimax', input: 0.1, output: 0.1 },

    // ── Ollama (本地) ─────────────────────────────────────────────────────────
    { id: 'ollama/llama3.2', name: 'Llama 3.2 3B', provider: 'ollama', input: 0, output: 0 },
    { id: 'ollama/llama3.1:8b', name: 'Llama 3.1 8B', provider: 'ollama', input: 0, output: 0 },
    { id: 'ollama/llama3.1:70b', name: 'Llama 3.1 70B', provider: 'ollama', input: 0, output: 0 },
    { id: 'ollama/qwen2.5:7b', name: 'Qwen 2.5 7B', provider: 'ollama', input: 0, output: 0 },
    { id: 'ollama/deepseek-r1:7b', name: 'DeepSeek R1 7B', provider: 'ollama', input: 0, output: 0 },
    { id: 'ollama/mistral:7b', name: 'Mistral 7B', provider: 'ollama', input: 0, output: 0 },
    { id: 'ollama/gemma2:9b', name: 'Gemma 2 9B', provider: 'ollama', input: 0, output: 0 },
    { id: 'ollama/phi3.5', name: 'Phi 3.5 Mini', provider: 'ollama', input: 0, output: 0 },

    // ── vLLM (本地) ───────────────────────────────────────────────────────────
    { id: 'vllm/local-model', name: '本地模型（启动 vLLM 后可用）', provider: 'vllm', input: 0, output: 0 },
];

export { ALL_MODELS };
export type { StaticModelInfo };
