import type {
  ApiEnvelope,
  SafeActionIntent,
  SafeActionPreview,
  SafeActionReceipt,
} from "@powerchain/energy-contracts";
import { energyApiFetch } from "../../api/energy-client";

export const safeActionsService = {
  preview(
    input: Omit<SafeActionIntent, "organizationId" | "actorId">,
  ) {
    return energyApiFetch<ApiEnvelope<SafeActionPreview>>("/safe-actions/preview", {
      method: "POST",
      body: JSON.stringify(input),
      headers: { "Idempotency-Key": input.idempotencyKey },
    }).then((response) => response.data);
  },

  execute(input: {
    actionId: string;
    confirmationToken: string;
    expectedVersion: number;
  }) {
    return energyApiFetch<ApiEnvelope<SafeActionReceipt>>("/safe-actions/execute", {
      method: "POST",
      body: JSON.stringify(input),
    }).then((response) => response.data);
  },
};
