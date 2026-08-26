import type { ApiEnvelope, DepinNetworkSummary, DepinNode } from "@powerchain/energy-contracts";
import { energyApiFetch } from "../../api/energy-client";

export const depinService = {
  nodes() {
    return energyApiFetch<ApiEnvelope<DepinNode[]>>("/depin/nodes").then((response) => response.data);
  },
  summary() {
    return energyApiFetch<ApiEnvelope<DepinNetworkSummary[]>>("/depin/summary").then((response) => response.data);
  },
};
