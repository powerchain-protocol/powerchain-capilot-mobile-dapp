import type { ExchangeDescriptor } from '../../types/exchanges';

export const EXCHANGE_CATALOG: readonly ExchangeDescriptor[] = [
  { id: 'jupiter', label: 'Jupiter', network: 'solana', mode: 'read-only', enabledByDefault: true },
  { id: 'orca', label: 'Orca', network: 'solana', mode: 'read-only', enabledByDefault: false },
  { id: 'raydium', label: 'Raydium', network: 'solana', mode: 'read-only', enabledByDefault: false },
  { id: 'meteora', label: 'Meteora', network: 'solana', mode: 'read-only', enabledByDefault: false },
  { id: 'cetus', label: 'Cetus', network: 'sui', mode: 'read-only', enabledByDefault: false },
] as const;
