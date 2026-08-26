import type { PublicPlatformConfig, SystemHealth } from "@powerchain/energy-contracts";
import { JsonHttpClient } from "../http.ts";

export class PlatformSystemClient {
  constructor(private readonly http: JsonHttpClient) {}

  getHealth() {
    return this.http.request<SystemHealth>("/health");
  }

  getReadiness() {
    return this.http.request<SystemHealth>("/health/ready");
  }

  getConfig() {
    return this.http.request<PublicPlatformConfig>("/config");
  }
}
