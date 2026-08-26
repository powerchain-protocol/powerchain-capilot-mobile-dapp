export type DiagnosticsPayload = {
  service: string;
  version: string;
  ai: { mode: string; providers: string[]; fallbackEnabled: boolean; readiness?: Array<{ name: string; status: 'configured' | 'not_configured' }> };
  chat: { enabled: boolean; encryptedAtRest: boolean; memoryEnabled: boolean };
  operations: { configured: boolean; dataMode: string; features: Record<string, boolean> };
  networks: {
    solana: { cluster: string; provider: string; commitment: string };
    sui: { network: string };
  };
  rateLimit: { store: string };
  generatedAt: string;
};
