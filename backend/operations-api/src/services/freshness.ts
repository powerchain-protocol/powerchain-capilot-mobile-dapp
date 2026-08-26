import type { FreshnessState, OperationalStatus } from '@powerchain/operations-contracts';

export function freshness(observedAt: Date | null, maxAgeSeconds: number, now = new Date()): FreshnessState {
  if (!observedAt) return 'unknown';
  return now.getTime() - observedAt.getTime() <= maxAgeSeconds * 1000 ? 'fresh' : 'stale';
}

export function operationalStatus(value: string | null | undefined): OperationalStatus {
  if (value === 'operational' || value === 'degraded' || value === 'offline' || value === 'unknown') return value;
  return 'unknown';
}
