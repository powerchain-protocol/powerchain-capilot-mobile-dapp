import type { FastifyRequest } from "fastify";
import { env } from "../config/env.js";
import { authenticate } from "../lib/session.js";

const ALLOWED_PREFIXES = ["/health", "/config", "/ems/", "/iot/", "/depin/", "/market-data/", "/actions/", "/wallets/", "/sites", "/alarms", "/events", "/twin", "/exports/", "/flow/"] as const;

function operationalPath(request: FastifyRequest) {
  const raw = request.raw.url ?? request.url;
  const url = new URL(raw, "http://powerchain.local");
  const path = url.pathname.replace(/^\/api\/v1/, "") || "/";
  if (!ALLOWED_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix))) {
    throw Object.assign(new Error("OPERATIONS_ROUTE_NOT_ALLOWED"), { statusCode: 404 });
  }
  return `${path}${url.search}`;
}

async function operationalIdentity(request: FastifyRequest) {
  const { user } = await authenticate(request);
  const profileOrganization = user.profile?.organization?.trim() || "";
  const requestedOrganization = typeof request.headers["x-organization-id"] === "string" ? request.headers["x-organization-id"].trim() : "";
  if (profileOrganization && requestedOrganization && profileOrganization !== requestedOrganization) {
    throw Object.assign(new Error("ORGANIZATION_CONTEXT_MISMATCH"), { statusCode: 403 });
  }
  const organizationId = profileOrganization || (env.NODE_ENV !== "production" ? requestedOrganization || "dev-org" : "");
  if (!organizationId) throw Object.assign(new Error("ORGANIZATION_CONTEXT_REQUIRED"), { statusCode: 403 });
  return { userId: user.id, organizationId };
}

export async function forwardOperationalRequest(request: FastifyRequest, body?: unknown, pathOverride?: string) {
  const path = pathOverride ?? operationalPath(request);
  const publicRoute = path === "/health" || path.startsWith("/health?") || path === "/config" || path.startsWith("/config?");
  const headers: Record<string,string> = {
    accept: "application/json",
    "x-request-id": request.id,
    "x-trace-id": typeof request.headers["x-trace-id"] === "string" ? request.headers["x-trace-id"] : request.id,
  };
  if (!publicRoute) {
    const identity = await operationalIdentity(request);
    if (!env.OPERATIONS_INTERNAL_SECRET) throw Object.assign(new Error("OPERATIONS_GATEWAY_NOT_CONFIGURED"), { statusCode: 503 });
    headers.authorization = `Bearer ${env.OPERATIONS_INTERNAL_SECRET}`;
    headers["x-user-id"] = identity.userId;
    headers["x-organization-id"] = identity.organizationId;
  }
  const idempotency = request.headers["idempotency-key"];
  if (typeof idempotency === "string") headers["idempotency-key"] = idempotency;
  if (body !== undefined) headers["content-type"] = "application/json";
  const response = await fetch(`${env.OPERATIONS_API_URL.replace(/\/$/, "")}${path}`, {
    method: request.method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(env.OPERATIONS_API_TIMEOUT_MS),
  });
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const error = new Error(typeof payload === "object" && payload && "error" in payload ? String((payload as {error:unknown}).error) : `OPERATIONS_HTTP_${response.status}`);
    Object.assign(error, { statusCode: response.status, details: payload });
    throw error;
  }
  return payload;
}
