import type { IsoTimestamp } from "./common.ts";

export interface DepinNode {
  id: string;
  network: string;
  operatorId?: string;
  siteId?: string;
  region?: string;
  nodeType: "gateway" | "sensor" | "oracle" | "compute" | "storage" | "other";
  status: "active" | "degraded" | "inactive" | "unknown";
  identityReference?: string;
  lastHeartbeatAt?: IsoTimestamp;
  rewards?: {
    asset: string;
    amountBaseUnits: string;
    decimals: number;
  };
}

export interface DepinNetworkSummary {
  network: string;
  activeNodes: number;
  degradedNodes: number;
  inactiveNodes: number;
  lastIndexedAt?: IsoTimestamp;
}
