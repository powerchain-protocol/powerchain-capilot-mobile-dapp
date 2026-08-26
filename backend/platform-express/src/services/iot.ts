import type { IotDevice, TelemetryPoint } from "@powerchain/energy-contracts";
import { prisma } from "../db/prisma.js";

export async function listIotDevices(organizationId: string): Promise<IotDevice[]> {
  const rows = await prisma.iotDevice.findMany({
    where: { organizationId },
    orderBy: [{ connectivity: "asc" }, { name: "asc" }],
    take: 500,
  });
  return rows.map((row) => ({
    id: row.id,
    siteId: row.siteId,
    name: row.name,
    kind: row.kind as IotDevice["kind"],
    manufacturer: row.manufacturer ?? undefined,
    model: row.model ?? undefined,
    serialNumber: row.serialNumber ?? undefined,
    firmwareVersion: row.firmwareVersion ?? undefined,
    connectivity: row.connectivity.toLowerCase() as IotDevice["connectivity"],
    lastSeenAt: row.lastSeenAt?.toISOString(),
    telemetrySource: "postgres.telemetry",
  }));
}

export async function listTelemetry(
  organizationId: string,
  deviceId: string,
  limit = 100,
): Promise<TelemetryPoint[]> {
  const rows = await prisma.telemetryReading.findMany({
    where: { organizationId, deviceId },
    orderBy: { observedAt: "desc" },
    take: Math.min(Math.max(limit, 1), 500),
  });
  return rows.map((row) => ({
    deviceId: row.deviceId,
    metric: row.metric,
    value: String(row.value),
    unit: row.unit,
    observedAt: row.observedAt.toISOString(),
    source: {
      source: row.source,
      observedAt: row.observedAt.toISOString(),
      receivedAt: row.receivedAt.toISOString(),
      quality: row.quality.toLowerCase() as TelemetryPoint["source"]["quality"],
    },
  }));
}
