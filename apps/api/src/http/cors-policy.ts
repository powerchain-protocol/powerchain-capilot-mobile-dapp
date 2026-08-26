import type { FastifyCorsOptions } from "@fastify/cors";
import { env } from "../config/env";

export const CORS_METHODS = [
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
] as const;

export const CORS_ALLOWED_HEADERS = [
  "Accept",
  "Authorization",
  "Content-Type",
  "Idempotency-Key",
  "If-Match",
  "X-Client-Request-Id",
  "X-Correlation-Id",
  "X-Request-Id",
  "X-Trace-Id",
] as const;

export const CORS_EXPOSED_HEADERS = [
  "Retry-After",
  "X-Request-Id",
] as const;

function normalizeOrigin(value: string): string {
  return new URL(value).origin;
}

export function configuredCorsOrigins(): string[] {
  if (env.CORS_ORIGIN.trim() === "*") return ["*"];

  return [...new Set(
    env.CORS_ORIGIN
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .map(normalizeOrigin),
  )];
}

function isLocalDevelopmentOrigin(origin: string) {
  try {
    const parsed = new URL(origin);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      ["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsed.hostname)
    );
  } catch {
    return false;
  }
}

export function isCorsOriginAllowed(origin?: string | null): boolean {
  // Native Expo/iOS/Android requests and trusted server-to-server calls often
  // do not send a browser Origin header. CORS is a browser boundary, so those
  // requests are allowed to continue to normal authentication/authorization.
  if (!origin) return true;

  const allowed = configuredCorsOrigins();
  if (allowed.includes("*")) return env.NODE_ENV !== "production";

  try {
    const normalized = normalizeOrigin(origin);
    if (allowed.includes(normalized)) return true;
    return (
      env.NODE_ENV !== "production" &&
      env.CORS_ALLOW_LOCALHOST &&
      isLocalDevelopmentOrigin(normalized)
    );
  } catch {
    return false;
  }
}

export function buildCorsOptions(): FastifyCorsOptions {
  return {
    origin(origin, callback) {
      callback(null, isCorsOriginAllowed(origin));
    },
    credentials: env.CORS_CREDENTIALS,
    methods: [...CORS_METHODS],
    allowedHeaders: [...CORS_ALLOWED_HEADERS],
    exposedHeaders: [...CORS_EXPOSED_HEADERS],
    maxAge: env.CORS_MAX_AGE_SECONDS,
    strictPreflight: true,
  };
}

export function corsDiagnostics(origin?: string | null) {
  return {
    enabled: true,
    environment: env.NODE_ENV,
    requestOrigin: origin ?? null,
    requestOriginAllowed: isCorsOriginAllowed(origin),
    configuredOrigins: configuredCorsOrigins(),
    allowNativeNoOrigin: true,
    allowLocalhostInDevelopment: env.CORS_ALLOW_LOCALHOST,
    credentials: env.CORS_CREDENTIALS,
    methods: [...CORS_METHODS],
    allowedHeaders: [...CORS_ALLOWED_HEADERS],
    exposedHeaders: [...CORS_EXPOSED_HEADERS],
    maxAgeSeconds: env.CORS_MAX_AGE_SECONDS,
  } as const;
}
