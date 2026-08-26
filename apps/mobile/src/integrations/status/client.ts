import { apiFetch } from "../../api/client";
import type { IntegrationSummary } from "../../types/integrations";

export async function getIntegrationStatus() {
  return apiFetch<IntegrationSummary>("/integrations/status");
}
