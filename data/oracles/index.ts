import type { OracleDescriptor } from '../../types/oracles';

export const ORACLE_CATALOG: readonly OracleDescriptor[] = [
  { id: 'pyth', label: 'Pyth', domain: 'price', trustTier: 'verified', readOnly: true, enabledByDefault: true },
  { id: 'helius', label: 'Helius', domain: 'chain', trustTier: 'verified', readOnly: true, enabledByDefault: true },
  { id: 'meter-attestation', label: 'Meter Attestation', domain: 'energy', trustTier: 'authoritative', readOnly: true, enabledByDefault: true },
  { id: 'weather', label: 'Weather Context', domain: 'weather', trustTier: 'contextual', readOnly: true, enabledByDefault: false },
] as const;
