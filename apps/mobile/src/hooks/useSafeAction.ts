import { useState } from "react";
import type {
  SafeActionIntent,
  SafeActionPreview,
  SafeActionReceipt,
} from "@powerchain/energy-contracts";
import { safeActionsService } from "../services/safe-actions";

export function useSafeAction() {
  const [preview, setPreview] = useState<SafeActionPreview | null>(null);
  const [receipt, setReceipt] = useState<SafeActionReceipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  async function prepare(input: Omit<SafeActionIntent, "organizationId" | "actorId">) {
    setLoading(true);
    setError(null);
    try {
      const result = await safeActionsService.preview(input);
      setPreview(result);
      return result;
    } catch (value) {
      const next = value instanceof Error ? value : new Error("Action preview failed.");
      setError(next);
      throw next;
    } finally {
      setLoading(false);
    }
  }

  async function execute(expectedVersion = 1) {
    if (!preview?.confirmationToken) throw new Error("ACTION_CONFIRMATION_REQUIRED");
    setLoading(true);
    setError(null);
    try {
      const result = await safeActionsService.execute({
        actionId: preview.intentId,
        confirmationToken: preview.confirmationToken,
        expectedVersion,
      });
      setReceipt(result);
      return result;
    } catch (value) {
      const next = value instanceof Error ? value : new Error("Action execution failed.");
      setError(next);
      throw next;
    } finally {
      setLoading(false);
    }
  }

  return { preview, receipt, loading, error, prepare, execute, reset: () => { setPreview(null); setReceipt(null); setError(null); } };
}
