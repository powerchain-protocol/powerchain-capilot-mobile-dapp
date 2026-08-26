import type { IsoTimestamp, SourceMeta } from "./common.ts";

export type DeviceKind =
  | "smart_meter"
  | "inverter"
  | "battery_controller"
  | "ev_charger"
  | "weather_station"
  | "gateway"
  | "sensor"
  | "other";

export interface IotDevice {
  id: string;
  siteId: string;
  name: string;
  kind: DeviceKind;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  firmwareVersion?: string;
  connectivity: "online" | "degraded" | "offline" | "unknown";
  lastSeenAt?: IsoTimestamp;
  telemetrySource?: string;
}

export interface TelemetryPoint {
  deviceId: string;
  metric: string;
  value: string;
  unit: string;
  observedAt: IsoTimestamp;
  source: SourceMeta;
}

export interface DeviceCommandPreview {
  previewId: string;
  deviceId: string;
  command: string;
  parameters: Record<string, unknown>;
  policyDecision: "allowed" | "review_required" | "blocked";
  policyReasons: string[];
  expiresAt: IsoTimestamp;
}
