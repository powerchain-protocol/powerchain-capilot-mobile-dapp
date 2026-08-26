import { createHash, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";


function constantTimeEqual(a: string, b: string): boolean {
  const ah = createHash("sha256").update(a).digest();
  const bh = createHash("sha256").update(b).digest();
  return timingSafeEqual(ah, bh);
}

export function internalBearerMatches(token: string, secret: string): boolean {
  return Boolean(secret) && constantTimeEqual(token, secret);
}

export interface OperationsActor {
  userId: string;
  organizationId: string;
  email?: string;
  source: "internal" | "supabase" | "development";
}

export interface OperationsAuthAdapter {
  kind: OperationsActor["source"];
  verify(input: { token: string; headers: Record<string, string | string[] | undefined> }): Promise<OperationsActor>;
}

class InternalFastifyAuthAdapter implements OperationsAuthAdapter {
  kind = "internal" as const;
  async verify({ token, headers }: { token: string; headers: Record<string, string | string[] | undefined> }) {
    if (!config.OPERATIONS_INTERNAL_SECRET || !constantTimeEqual(token, config.OPERATIONS_INTERNAL_SECRET)) throw new Error("AUTH_INVALID_INTERNAL_TOKEN");
    const userId = String(headers["x-user-id"] ?? "").trim();
    const organizationId = String(headers["x-organization-id"] ?? "").trim();
    if (!userId || !organizationId) throw new Error("AUTH_IDENTITY_HEADERS_REQUIRED");
    return { userId, organizationId, source: this.kind };
  }
}

class SupabaseAuthAdapter implements OperationsAuthAdapter {
  kind = "supabase" as const;
  private readonly client = createClient(config.SUPABASE_URL!, config.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  async verify({ token }: { token: string }) {
    const { data, error } = await this.client.auth.getUser(token);
    if (error || !data.user) throw new Error("AUTH_INVALID_TOKEN");
    const organizationId = String(data.user.app_metadata?.organization_id ?? "").trim();
    if (!organizationId) throw new Error("AUTH_ORGANIZATION_REQUIRED");
    return { userId: data.user.id, organizationId, email: data.user.email, source: this.kind };
  }
}

class DevelopmentAuthAdapter implements OperationsAuthAdapter {
  kind = "development" as const;
  async verify({ headers }: { token: string; headers: Record<string, string | string[] | undefined> }) {
    return {
      userId: String(headers["x-user-id"] ?? "dev-user"),
      organizationId: String(headers["x-organization-id"] ?? "dev-org"),
      source: this.kind,
    };
  }
}

export const operationsAuthAdapter: OperationsAuthAdapter =
  config.OPERATIONS_AUTH_PROVIDER === "internal" ? new InternalFastifyAuthAdapter()
    : config.OPERATIONS_AUTH_PROVIDER === "supabase" ? new SupabaseAuthAdapter()
    : new DevelopmentAuthAdapter();

declare global { namespace Express { interface Request { actor?: OperationsActor; traceId?: string; requestId?: string } } }

export const requireActor: RequestHandler = async (request, response, next) => {
  try {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "") ?? "";
    if (config.OPERATIONS_AUTH_PROVIDER !== "development" && !token) return response.status(401).json({ error: "AUTH_REQUIRED" });
    request.actor = await operationsAuthAdapter.verify({ token, headers: request.headers as Record<string, string | string[] | undefined> });
    next();
  } catch (error) {
    response.status(401).json({ error: error instanceof Error ? error.message : "AUTH_FAILED" });
  }
};
