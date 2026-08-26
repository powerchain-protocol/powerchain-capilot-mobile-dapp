import type { Router } from 'express';
import type { MarketDataClient } from '../clients/market-data.ts';
import type { SolanaReadClient } from '../clients/solana.ts';
import type { SuiReadClient } from '../clients/sui.ts';

async function timedCheck(name: string, run: () => Promise<void>, timeoutMs = 2_000) {
  const started = Date.now();
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      run(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(`${name} health check timed out.`)), timeoutMs); }),
    ]);
    return { name, status: 'ok' as const, latencyMs: Date.now() - started };
  } catch (error) {
    return { name, status: 'down' as const, latencyMs: Date.now() - started, detail: error instanceof Error ? error.message : `${name} unavailable.` };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function registerHealthRoutes(router: Router, deps: {
  solana: SolanaReadClient;
  sui: SuiReadClient;
  market: MarketDataClient;
  databaseHealth: () => Promise<void>;
  supabaseConfigured: boolean;
}) {
  router.get('/health/live', (_req, res) => res.json({ status: 'ok', service: 'powerchain-operations-api', version: '1.0.0', generatedAt: new Date().toISOString() }));
  router.get('/health/ready', async (_req, res) => {
    const [database, solana, sui, market] = await Promise.all([
      timedCheck('database', deps.databaseHealth),
      deps.solana.health().then((check) => ({ name: 'solana', ...check })),
      deps.sui.health().then((check) => ({ name: 'sui', ...check })),
      deps.market.health().then((check) => ({ name: 'market-data', ...check })),
    ]);
    const checks = [
      database,
      { name: 'supabase', status: deps.supabaseConfigured ? 'ok' as const : 'not_configured' as const },
      solana,
      sui,
      market,
    ];
    const criticalDown = database.status === 'down';
    const degraded = checks.some((check) => check.status === 'down' || check.status === 'not_configured' || check.status === 'degraded');
    res.status(criticalDown ? 503 : 200).json({
      status: criticalDown ? 'not_ready' : degraded ? 'degraded' : 'ready',
      checks,
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
    });
  });
}
