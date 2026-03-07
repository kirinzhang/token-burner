/**
 * OpenRouter OAuth PKCE 路由
 * GET  /api/oauth/openrouter/start    → 生成授权 URL
 * POST /api/oauth/callback            → 用 code 换取 API Key
 * GET  /api/oauth/providers           → 返回所有 Provider 元数据（用于 UI）
 */

import { Router } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import { loadConfig, saveConfig } from '../../config/schema.js';
import { PROVIDER_META } from '../../providers/factory.js';

export const oauthRouter = Router();

/** 内存缓存 code_verifier（有效期 10 分钟） */
const pendingVerifiers = new Map<string, { verifier: string; expireAt: number }>();

function base64url(buf: Buffer): string {
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function generateVerifier(): string {
    return base64url(randomBytes(32));
}

async function generateChallenge(verifier: string): Promise<string> {
    const hash = createHash('sha256').update(verifier).digest();
    return base64url(hash);
}

// ─── GET /api/oauth/openrouter/start ────────────────────────────────────────
oauthRouter.get('/openrouter/start', async (req, res) => {
    try {
        const callbackUrl = `${req.protocol}://${req.hostname}:${process.env.PORT ?? 3000}`;
        const verifier = generateVerifier();
        const challenge = await generateChallenge(verifier);
        const state = randomBytes(8).toString('hex');

        // 缓存 verifier（10 分钟）
        pendingVerifiers.set(state, { verifier, expireAt: Date.now() + 10 * 60 * 1000 });

        const authUrl = new URL('https://openrouter.ai/auth');
        authUrl.searchParams.set('callback_url', callbackUrl);
        authUrl.searchParams.set('code_challenge', challenge);
        authUrl.searchParams.set('code_challenge_method', 'S256');
        authUrl.searchParams.set('state', state);

        res.json({ authUrl: authUrl.toString(), state });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// ─── POST /api/oauth/callback ────────────────────────────────────────────────
oauthRouter.post('/callback', async (req, res) => {
    const { code, state } = req.body as { code?: string; state?: string };

    if (!code) {
        return res.status(400).json({ error: '缺少 code 参数' });
    }

    // 取回 verifier
    const entry = state ? pendingVerifiers.get(state) : undefined;
    const codeVerifier = entry?.verifier;
    if (state && entry) pendingVerifiers.delete(state);

    try {
        const body: Record<string, string> = { code };
        if (codeVerifier) {
            body['code_verifier'] = codeVerifier;
            body['code_challenge_method'] = 'S256';
        }

        const response = await fetch('https://openrouter.ai/api/v1/auth/keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const err = await response.text();
            return res.status(400).json({ error: `OpenRouter 换取 Key 失败: ${err}` });
        }

        const { key } = await response.json() as { key: string };

        // 将 key 保存到配置中
        const config = loadConfig();
        config.activeProvider = 'openrouter';
        config.openrouter = { apiKey: key };
        saveConfig(config);

        res.json({ success: true, message: 'OpenRouter 授权成功，API Key 已保存' });
    } catch (err) {
        res.status(500).json({ error: (err as Error).message });
    }
});

// ─── GET /api/oauth/providers ────────────────────────────────────────────────
oauthRouter.get('/providers', (_req, res) => {
    res.json(PROVIDER_META);
});
