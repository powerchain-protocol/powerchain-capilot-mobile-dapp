import type { DataQuality, FreshnessMeta, SourceMeta } from "@powerchain/energy-contracts";
import { config } from "../config.js";

export function freshness(observedAt: Date, receivedAt = new Date()): FreshnessMeta {
  const ageSeconds = Math.max(0, Math.floor((receivedAt.getTime() - observedAt.getTime()) / 1000));
  const state = ageSeconds <= config.TELEMETRY_FRESH_SECONDS ? "fresh"
    : ageSeconds < config.TELEMETRY_STALE_SECONDS ? "aging" : "stale";
  return { state, ageSeconds, freshForSeconds: config.TELEMETRY_FRESH_SECONDS, staleAfterSeconds: config.TELEMETRY_STALE_SECONDS };
}

export function sourceMeta(source: string, observedAt: Date, receivedAt = new Date(), intervalSeconds?: number): SourceMeta {
  const f = freshness(observedAt, receivedAt);
  const quality: DataQuality = f.state === "fresh" ? "good" : f.state === "aging" ? "degraded" : "stale";
  return { source, observedAt: observedAt.toISOString(), receivedAt: receivedAt.toISOString(), intervalSeconds, quality, freshness: f };
}
