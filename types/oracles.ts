export type OracleProviderId = 'pyth' | 'chainlink' | 'helius' | 'meter-attestation' | 'weather';
export type OracleTrustTier = 'authoritative' | 'verified' | 'contextual' | 'untrusted';

export type OracleDescriptor = {
  id: OracleProviderId;
  label: string;
  domain: 'price' | 'energy' | 'chain' | 'weather';
  trustTier: OracleTrustTier;
  readOnly: true;
  enabledByDefault: boolean;
};

export type OracleObservation = {
  provider: OracleProviderId;
  subject: string;
  value: string;
  unit?: string;
  observedAt: string;
  receivedAt: string;
  sourceRef?: string;
  verified: boolean;
};
