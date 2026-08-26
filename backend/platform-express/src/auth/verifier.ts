import type { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";

export interface VerifiedActor {
  userId: string;
  organizationId: string;
  email?: string;
}

export interface AuthVerifier {
  verify(token: string, headers: Record<string, string | string[] | undefined>): Promise<VerifiedActor>;
}

class DevelopmentAuthVerifier implements AuthVerifier {
  async verify(_token: string, headers: Record<string, string | string[] | undefined>) {
    const userId = String(headers["x-user-id"] ?? "dev-user");
    const organizationId = String(headers["x-organization-id"] ?? "dev-org");
    return { userId, organizationId };
  }
}

class SupabaseAuthVerifier implements AuthVerifier {
  private readonly client = createClient(
    config.SUPABASE_URL!,
    config.SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  async verify(token: string) {
    const { data, error } = await this.client.auth.getUser(token);
    if (error || !data.user) throw new Error("AUTH_INVALID_TOKEN");
    const organizationId = String(data.user.app_metadata?.organization_id ?? "");
    if (!organizationId) throw new Error("AUTH_ORGANIZATION_REQUIRED");
    return {
      userId: data.user.id,
      organizationId,
      email: data.user.email,
    };
  }
}

export const authVerifier: AuthVerifier =
  config.ENERGY_AUTH_PROVIDER === "supabase"
    ? new SupabaseAuthVerifier()
    : new DevelopmentAuthVerifier();

declare global {
  namespace Express {
    interface Request {
      actor?: VerifiedActor;
    }
  }
}

export const requireActor: RequestHandler = async (request, response, next) => {
  try {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "") ?? "";
    if (config.ENERGY_AUTH_PROVIDER !== "development" && !token) {
      return response.status(401).json({ error: "AUTH_REQUIRED" });
    }
    request.actor = await authVerifier.verify(token, request.headers as Record<string, string | string[] | undefined>);
    next();
  } catch (error) {
    response.status(401).json({
      error: error instanceof Error ? error.message : "AUTH_FAILED",
    });
  }
};
