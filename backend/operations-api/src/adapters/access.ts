import type { OperationsPrismaClient } from '../db/prisma.ts';

export interface OperationsAccessAdapter {
  canAccessSite(userId: string, siteId: string): Promise<boolean>;
  siteIdForIotDevice(deviceId: string): Promise<string | null>;
  siteIdForDepinNode(nodeId: string): Promise<string | null>;
  siteIdForAlarm(alarmId: string): Promise<string | null>;
  canAccessWallet(userId: string, walletId: string): Promise<boolean>;
}

export class PrismaOperationsAccessAdapter implements OperationsAccessAdapter {
  constructor(private readonly prisma: OperationsPrismaClient) {}

  async canAccessSite(userId: string, siteId: string) {
    return Boolean(await this.prisma.siteAccess.findUnique({ where: { userId_siteId: { userId, siteId } }, select: { id: true } }));
  }

  async siteIdForIotDevice(deviceId: string) {
    return (await this.prisma.iotDevice.findUnique({ where: { id: deviceId }, select: { siteId: true } }))?.siteId ?? null;
  }

  async siteIdForDepinNode(nodeId: string) {
    return (await this.prisma.depinNode.findUnique({ where: { id: nodeId }, select: { siteId: true } }))?.siteId ?? null;
  }

  async siteIdForAlarm(alarmId: string) {
    return (await this.prisma.operationalAlarm.findUnique({ where: { id: alarmId }, select: { siteId: true } }))?.siteId ?? null;
  }

  async canAccessWallet(userId: string, walletId: string) {
    return Boolean(await this.prisma.operationalWallet.findFirst({ where: { id: walletId, userId }, select: { id: true } }));
  }
}
