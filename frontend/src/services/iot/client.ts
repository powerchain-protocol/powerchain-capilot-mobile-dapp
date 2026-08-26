import type { ApiEnvelope, IotDevice, TelemetryPoint } from "@powerchain/energy-contracts";
import { energyApiFetch } from "../../api/energy-client";

export const iotService = {
  devices() {
    return energyApiFetch<ApiEnvelope<IotDevice[]>>("/iot/devices").then((response) => response.data);
  },
  telemetry(deviceId: string, limit = 100) {
    return energyApiFetch<ApiEnvelope<TelemetryPoint[]>>(
      `/iot/devices/${encodeURIComponent(deviceId)}/telemetry?limit=${limit}`,
    ).then((response) => response.data);
  },
};
