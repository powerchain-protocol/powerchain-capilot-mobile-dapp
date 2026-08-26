import { prisma } from "../db/prisma.js";
import type { OperationsActor } from "./adapter.js";

export async function requireSiteAccess(actor: OperationsActor, siteId: string, permission = "site.read") {
  const grant = await prisma.siteAccess.findFirst({
    where: {
      organizationId: actor.organizationId,
      userId: actor.userId,
      siteId,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
  if (!grant) throw Object.assign(new Error("SITE_ACCESS_DENIED"), { statusCode: 403 });
  const permissions = Array.isArray(grant.permissions) ? grant.permissions.map(String) : [];
  if (!permissions.includes("*") && !permissions.includes(permission)) {
    throw Object.assign(new Error("SITE_PERMISSION_DENIED"), { statusCode: 403 });
  }
  return grant;
}

export async function assertResourceSite(organizationId: string, siteId: string) {
  const site = await prisma.energySite.findFirst({ where: { id: siteId, organizationId }, select: { id: true } });
  if (!site) throw Object.assign(new Error("SITE_NOT_FOUND"), { statusCode: 404 });
}
