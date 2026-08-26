export class AppConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppConfigurationError';
  }
}

function normalizeUrl(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, '') : null;
}

const apiBaseUrl = normalizeUrl(process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_BASE_URL);
const publicNetwork = process.env.EXPO_PUBLIC_NETWORK?.trim() || process.env.EXPO_PUBLIC_SOLANA_NETWORK?.trim() || 'devnet';
const aiMode = process.env.EXPO_PUBLIC_AI_MODE?.trim() || 'managed';

export const env = Object.freeze({
  appEnv: process.env.EXPO_PUBLIC_APP_ENV?.trim() || process.env.NODE_ENV?.trim() || 'development',
  apiBaseUrl,
  network: publicNetwork,
  dataMode: process.env.EXPO_PUBLIC_DATA_MODE?.trim() || 'demo',
  aiMode,
  managedAiEnabled: aiMode === 'managed',
  solana: {
    network: process.env.EXPO_PUBLIC_SOLANA_NETWORK?.trim() || publicNetwork,
    rpcUrl: normalizeUrl(process.env.EXPO_PUBLIC_SOLANA_RPC_URL) || 'https://api.devnet.solana.com',
    mainnetRpcUrl: normalizeUrl(process.env.EXPO_PUBLIC_SOLANA_MAINNET_RPC_URL) || 'https://api.mainnet-beta.solana.com',
  },
  credits: {
    token: process.env.EXPO_PUBLIC_CREDIT_TOKEN?.trim() || 'PWRC',
    network: process.env.EXPO_PUBLIC_CREDIT_NETWORK?.trim() || 'mainnet-beta',
    mint: process.env.EXPO_PUBLIC_PWRC_MINT?.trim() || 'PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc',
  },
});

export function requireApiBaseUrl() {
  if (!env.apiBaseUrl) {
    throw new AppConfigurationError('PowerChain API is not configured. Set EXPO_PUBLIC_API_URL for this build.');
  }
  return env.apiBaseUrl;
}
