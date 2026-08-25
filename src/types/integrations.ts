export type IntegrationId =
  | "openai"
  | "solana"
  | "pyth"
  | "birdeye"
  | "database";

export type IntegrationStatus =
  | "operational"
  | "degraded"
  | "unavailable"
  | "misconfigured"
  | "unknown";

export type IntegrationHealth = {
  id: IntegrationId;
  name: string;
  status: IntegrationStatus;
  message?: string;
  checkedAt: string;
  latencyMs?: number;
};

export type IntegrationSummary = {
  overall: IntegrationStatus;
  items: IntegrationHealth[];
};
