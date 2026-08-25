import { createHash } from "node:crypto";

function canonical(value: unknown): string {
  if (value === undefined) return "null";
  if (Array.isArray(value)) {
    return `[${value.map(canonical).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function deterministicFingerprint(value: unknown) {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

export function copilotRequestFingerprint(input: {
  conversationId?: string;
  message: string;
  context?: unknown;
}) {
  return deterministicFingerprint({
    conversationId: input.conversationId ?? null,
    message: input.message,
    context: input.context ?? null,
  });
}
