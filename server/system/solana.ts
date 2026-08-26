import { loadNetworkConfig, sanitizedSolanaSystemView } from '../config/networks.ts';

export function getSanitizedSolanaSystemConfig(source: NodeJS.ProcessEnv = process.env) {
  return sanitizedSolanaSystemView(loadNetworkConfig(source));
}

export function createSystemSolanaHandler(source: NodeJS.ProcessEnv = process.env) {
  const view = getSanitizedSolanaSystemConfig(source);
  return async function handle() {
    return new Response(JSON.stringify(view), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  };
}
