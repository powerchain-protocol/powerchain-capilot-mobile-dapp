import { apiFetch } from "../../api/client";
import { getIntegrationStatus } from "./client";

export type McpStatus = {
  enabled: boolean;
  servers?: Array<{
    serverId: string;
    status: string;
    tools?: Array<{ name: string; functionName: string; readOnly: boolean }>;
    error?: string;
  }>;
};

export type DiagnosticSnapshot = {
  integrations: Awaited<ReturnType<typeof getIntegrationStatus>> | null;
  runtime: Record<string, unknown> | null;
  solana: Record<string, unknown> | null;
  cors: Record<string, unknown> | null;
  mcp: McpStatus | null;
  credits: Record<string, unknown> | null;
  failures: string[];
  checkedAt: string;
};

async function capture<T>(label: string, request: Promise<T>, failures: string[]) {
  try {
    return await request;
  } catch {
    failures.push(label);
    return null;
  }
}

export async function getDiagnosticSnapshot(): Promise<DiagnosticSnapshot> {
  const failures: string[] = [];
  const [integrations, runtime, solana, cors, mcp, credits] = await Promise.all([
    capture("integrations", getIntegrationStatus(), failures),
    capture("runtime", apiFetch<Record<string, unknown>>("/config"), failures),
    capture("solana", apiFetch<Record<string, unknown>>("/system/solana"), failures),
    capture("cors", apiFetch<Record<string, unknown>>("/cors"), failures),
    capture("mcp", apiFetch<McpStatus>("/mcp/tools"), failures),
    capture("credits", apiFetch<Record<string, unknown>>("/credits/reconciliation"), failures),
  ]);

  return {
    integrations,
    runtime,
    solana,
    cors,
    mcp,
    credits,
    failures,
    checkedAt: new Date().toISOString(),
  };
}
