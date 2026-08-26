import type { IotDevice, TelemetryPoint } from "@powerchain/energy-contracts";
import { assertResourceSite } from "../auth/site-access.js";
import { prisma } from "../db/prisma.js";
import { sourceMeta } from "../lib/freshness.js";

export async function listIotDevices(organizationId: string, siteId: string): Promise<IotDevice[]> {
  await assertResourceSite(organizationId, siteId);
  const rows = await prisma.iotDevice.findMany({ where: { organizationId, siteId }, orderBy: [{ connectivity: "asc" }, { name: "asc" }], take: 500 });
  return rows.map((row) => ({ id: row.id, siteId: row.siteId, name: row.name, kind: row.kind as IotDevice["kind"],
    manufacturer: row.manufacturer ?? undefined, model: row.model ?? undefined, serialNumber: row.serialNumber ?? undefined,
    firmwareVersion: row.firmwareVersion ?? undefined, connectivity: row.connectivity.toLowerCase() as IotDevice["connectivity"],
    lastSeenAt: row.lastSeenAt?.toISOString(), telemetrySource: "postgres.telemetry" }));
}

export async function listTelemetry(organizationId: string, siteId: string, deviceId: string, limit = 100): Promise<TelemetryPoint[]> {
  await assertResourceSite(organizationId, siteId);
  const device = await prisma.iotDevice.findFirst({ where: { id: deviceId, organizationId, siteId }, select: { id: true } });
  if (!device) throw Object.assign(new Error("DEVICE_NOT_FOUND"), { statusCode: 404 });
  const rows = await prisma.telemetryReading.findMany({ where: { organizationId, deviceId }, orderBy: { observedAt: "desc" }, take: Math.min(Math.max(limit,1),500) });
  return rows.map((row) => ({ deviceId: row.deviceId, metric: row.metric, value: String(row.value), unit: row.unit, observedAt: row.observedAt.toISOString(), source: sourceMeta(row.source, row.observedAt, row.receivedAt) }));
}
