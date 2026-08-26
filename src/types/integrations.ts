export type IntegrationId =
  | "ai"
  | "openai"
  | "anthropic"
  | "deepseek"
  | "llama"
  | "emergent"
  | "solana"
  | "sui"
  | "pyth"
  | "birdeye"
  | "postgres"
  | "database"
  | "mongo"
  | "redis"
  | "mcp";

export type IntegrationStatus =
  | "operational"
  | "degraded"
  | "unavailable"
  | "misconfigured"
  | "unknown";

export type IntegrationHealth = {
  id: IntegrationId | string;
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
