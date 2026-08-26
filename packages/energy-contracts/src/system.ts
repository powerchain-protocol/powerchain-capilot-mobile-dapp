import type { HealthStatus, IsoTimestamp, OperationalMode } from "./common.ts";

export interface ServiceHealth {
  id: string;
  label: string;
  status: HealthStatus;
  latencyMs?: number;
  lastSuccessfulCheckAt?: IsoTimestamp;
  configured: boolean;
  version?: string;
  detail?: string;
}

export interface SystemHealth {
  ok: boolean;
  service: string;
  version: string;
  mode: OperationalMode;
  checks: ServiceHealth[];
  checkedAt: IsoTimestamp;
}

export interface PublicPlatformConfig {
  version: string;
  environment: string;
  mode: OperationalMode;
  apiPrefix: string;
  networks: {
    solana: { cluster: string; provider: string; configured: boolean };
    sui: { network: string; configured: boolean };
  };
  features: {
    ems: boolean;
    iot: boolean;
    depin: boolean;
    safeActions: boolean;
  };
  providers: {
    auth: string;
    wallet: string[];
    marketData: string[];
  };
  databases: {
    postgresql: { configured: boolean; authoritative: true };
    supabase: { configured: boolean };
  };
}
