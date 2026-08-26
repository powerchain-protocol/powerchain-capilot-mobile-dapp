import assert from 'node:assert/strict';
import test from 'node:test';
import { decryptSetting, encryptSetting } from '../security/settings-crypto.ts';
import { issueJwtToken, verifyJwtToken } from '../auth/tokens.ts';
import { MemoryRateLimitStore } from '../rate-limit/store.ts';
import { enforceRateLimit, RateLimitExceededError } from '../rate-limit/limiter.ts';
import { loadNetworkConfig, sanitizedSolanaSystemView, PWRC_CANONICAL } from '../config/networks.ts';

test('AES-256-GCM protected settings round trip and fail under wrong key', () => {
  const encrypted = encryptSetting('sensitive-setting', 'a'.repeat(64));
  assert.notEqual(encrypted, 'sensitive-setting');
  assert.equal(decryptSetting(encrypted, 'a'.repeat(64)), 'sensitive-setting');
  assert.throws(() => decryptSetting(encrypted, 'b'.repeat(64)));
});

test('HS256 JWT session tokens verify required claims', () => {
  const secret = 'j'.repeat(64);
  const token = issueJwtToken({ sid: 'session-1', sub: 'user-1', iat: 100, exp: 200 }, secret);
  assert.equal(verifyJwtToken(token, secret, 150).sub, 'user-1');
  assert.throws(() => verifyJwtToken(token, secret, 201));
});

test('bearer credentials are fingerprinted inside rate-limit key rather than persisted raw', async () => {
  const store = new MemoryRateLimitStore();
  const request = new Request('https://api.test/', { headers: { authorization: 'Bearer very-secret-token' } });
  await enforceRateLimit({ request, store, namespace: 'ai', limit: 1, windowMs: 60_000 });
  await assert.rejects(
    enforceRateLimit({ request, store, namespace: 'ai', limit: 1, windowMs: 60_000 }),
    (error: unknown) => error instanceof RateLimitExceededError,
  );
});

test('Solana runtime derives Helius URL but sanitized system API exposes no secrets or RPC URL', () => {
  const config = loadNetworkConfig({
    SOLANA_NETWORK: 'devnet',
    SOLANA_RPC_PROVIDER: 'auto',
    HELIUS_API_KEY: 'top-secret-helius-key',
  } as NodeJS.ProcessEnv);
  assert.equal(config.solana.provider, 'helius');
  assert.match(config.solana.rpcUrl, /devnet\.helius-rpc\.com/);
  assert.match(config.solana.rpcUrl, /top-secret-helius-key/);
  assert.equal(config.solana.pwrc.mint, PWRC_CANONICAL.mint);
  const publicView = sanitizedSolanaSystemView(config);
  const serialized = JSON.stringify(publicView);
  assert.doesNotMatch(serialized, /top-secret-helius-key/);
  assert.doesNotMatch(serialized, /helius-rpc\.com/);
  assert.equal(publicView.heliusConfigured, true);
});

test('Sui explicit RPC overrides selected network profile', () => {
  const config = loadNetworkConfig({ SUI_NETWORK: 'mainnet', SUI_RPC_URL: 'https://sui.example.test' } as NodeJS.ProcessEnv);
  assert.equal(config.sui.network, 'mainnet');
  assert.equal(config.sui.rpcUrl, 'https://sui.example.test');
});

import { loadServerEnv } from '../config/env.ts';
import { loadMcpConfig } from '../src/mcp/config.ts';

test('production configuration fails closed for JWT and Redis prerequisites', () => {
  assert.throws(() => loadServerEnv({ AUTH_TOKEN_MODE: 'jwt', JWT_SECRET: 'short' } as NodeJS.ProcessEnv));
  assert.throws(() => loadServerEnv({ RATE_LIMIT_STORE: 'redis' } as NodeJS.ProcessEnv));
  assert.doesNotThrow(() => loadServerEnv({ AUTH_TOKEN_MODE: 'jwt', JWT_SECRET: 'x'.repeat(64) } as NodeJS.ProcessEnv));
});

test('production MCP requires explicit hostname allowlist in addition to allowedTools', () => {
  const registry = JSON.stringify([{ id: 'energy', url: 'https://mcp.example.com/mcp', allowedTools: ['search_assets'] }]);
  assert.throws(() => loadMcpConfig({ NODE_ENV: 'production', MCP_SERVERS_JSON: registry } as NodeJS.ProcessEnv));
  assert.doesNotThrow(() => loadMcpConfig({ NODE_ENV: 'production', MCP_SERVERS_JSON: registry, MCP_ALLOWED_HOSTS: 'mcp.example.com' } as NodeJS.ProcessEnv));
});

test('PWRC aliases cannot override canonical mint or credit network', () => {
  assert.throws(() => loadNetworkConfig({ PWRC_MINT: '11111111111111111111111111111111' } as NodeJS.ProcessEnv));
  assert.throws(() => loadNetworkConfig({ PWRC_CREDIT_NETWORK: 'devnet' } as NodeJS.ProcessEnv));
  assert.throws(() => loadNetworkConfig({ POWERCHAIN_CREDIT_TOKEN: 'OTHER' } as NodeJS.ProcessEnv));
});

test('current .env Solana program aliases and Sui RPC profiles resolve correctly', () => {
  const config = loadNetworkConfig({
    SOLANA_NETWORK: 'devnet',
    SOLANA_RPC_PROVIDER: 'public',
    SOLANA_SYSTEM_PROGRAM_ID: '11111111111111111111111111111111',
    SOLANA_TOKEN_PROGRAM_ID: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    SOLANA_TOKEN_2022_PROGRAM_ID: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
    SOLANA_ASSOCIATED_TOKEN_PROGRAM_ID: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
    SOLANA_COMPUTE_BUDGET_PROGRAM_ID: 'ComputeBudget111111111111111111111111111111',
    SOLANA_MEMO_PROGRAM_ID: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
    SUI_NETWORK: 'devnet',
    SUI_RPC_DEVNET_URL: 'https://fullnode.devnet.sui.io:443',
    SUI_NETWORK_DEVNET: 'devnet',
  } as NodeJS.ProcessEnv);
  assert.equal(config.solana.programs.system, '11111111111111111111111111111111');
  assert.equal(config.solana.programs.token2022, 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
  assert.equal(config.sui.rpcUrl, 'https://fullnode.devnet.sui.io:443');
});

test('current .env aliases feed server AI, rate-limit and CORS configuration', () => {
  const env = loadServerEnv({
    AI_REQUEST_TIMEOUT_MS: '45000',
    RATE_LIMIT_MAX: '120',
    RATE_LIMIT_WINDOW_MS: '60000',
    CORS_ORIGINS: 'https://mobile.powerchain.energy',
    CHAT_ENABLED: 'false',
  } as NodeJS.ProcessEnv);
  assert.equal(env.ai.timeoutMs, 45_000);
  assert.equal(env.rateLimit.globalLimit, 120);
  assert.equal(env.rateLimit.globalWindowMs, 60_000);
  assert.equal(env.cors.allowedOrigins, 'https://mobile.powerchain.energy');
});
