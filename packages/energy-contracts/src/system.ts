import type { HealthStatus, IsoTimestamp, OperationalMode } from "./common.ts";
import type { OperationalCompatibilityManifest } from "./operations.ts";

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
  compatibility: OperationalCompatibilityManifest;
  checks: ServiceHealth[];
  checkedAt: IsoTimestamp;
}

export interface PublicPlatformConfig {
  version: string;
  environment: string;
  mode: OperationalMode;
  apiPrefix: string;
  compatibility: OperationalCompatibilityManifest;
  networks: {
    solana: { cluster: string; provider: string; configured: boolean; readOnly: true };
    sui: { network: string; configured: boolean; readOnly: true };
  };
  features: {
    ems: boolean;
    iot: boolean;
    depin: boolean;
    marketData: boolean;
    safeActions: boolean;
    physicalExecution: false;
    settlementExecution: false;
  };
  providers: {
    auth: string;
    wallet: string[];
    marketData: string[];
    realtime: string;
  };
  databases: {
    postgresql: { configured: boolean; authoritative: true };
    supabase: { configured: boolean; authoritative: false; uses: Array<"auth" | "realtime"> };
  };
}
