import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { createHash } from "node:crypto";
import type { McpSecurityLimits, McpServerDefinition } from "./types.js";

const SECRET_KEY = /(^|_)(password|passwd|secret|private[_-]?key|seed|mnemonic|api[_-]?key|authorization|auth[_-]?token|access[_-]?token|refresh[_-]?token|session|cookie)($|_)/i;

function isPrivateIp(address: string): boolean {
  if (address === "::1" || address === "0.0.0.0") return true;
  if (address.startsWith("10.") || address.startsWith("127.") || address.startsWith("169.254.") || address.startsWith("192.168.")) return true;
  const parts = address.split(".").map(Number);
  if (parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (/^(fc|fd|fe8|fe9|fea|feb)/i.test(address.replace(/:/g, ""))) return true;
  return false;
}

export async function assertMcpUrlAllowed(input: {
  server: McpServerDefinition;
  production: boolean;
  allowedHosts: Set<string>;
}): Promise<void> {
  const url = new URL(input.server.url);
  if (url.username || url.password) throw new Error("MCP URL may not contain credentials.");
  if (input.production && url.protocol !== "https:") throw new Error("Production MCP requires HTTPS.");
  if (!input.allowedHosts.has(url.hostname)) throw new Error(`MCP host ${url.hostname} is not allowlisted.`);
  if (input.production) {
    const addresses = isIP(url.hostname)
      ? [{ address: url.hostname }]
      : await lookup(url.hostname, { all: true, verbatim: true });
    if (addresses.some((entry) => isPrivateIp(entry.address))) {
      throw new Error(`MCP host ${url.hostname} resolves to a private/reserved address.`);
    }
  }
}

export function assertSafeArguments(value: unknown, limits: McpSecurityLimits): void {
  const serialized = JSON.stringify(value ?? {});
  if (Buffer.byteLength(serialized, "utf8") > limits.maxArgumentBytes) {
    throw new Error("MCP tool arguments exceed the configured egress limit.");
  }
  const visit = (node: unknown, path: string[]) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach((v, i) => visit(v, [...path, String(i)]));
    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
      if (SECRET_KEY.test(key)) throw new Error(`MCP argument field ${[...path, key].join(".")} is blocked by egress policy.`);
      visit(child, [...path, key]);
    }
  };
  visit(value, []);
}

export function redactArguments(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactArguments);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k,v]) => [k, SECRET_KEY.test(k) ? "[REDACTED]" : redactArguments(v)]));
}

export function sha256Json(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value ?? null)).digest("hex");
}
