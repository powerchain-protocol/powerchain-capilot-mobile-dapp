import type { OperationsPrismaClient } from '../db/prisma.ts';
import type { AlarmRepository } from './alarms.ts';
import type { DepinRepository } from './depin.ts';
import type { EmsRepository } from './ems.ts';
import type { EventRepository } from './events.ts';
import type { IotRepository } from './iot.ts';
import type { TwinAggregateRepository } from './twin.ts';

export class PrismaEmsRepository implements EmsRepository {
  constructor(private readonly prisma: OperationsPrismaClient) {}
  latestSnapshot(siteId: string) {
    return this.prisma.emsSnapshot.findFirst({ where: { siteId }, orderBy: [{ observedAt: 'desc' }, { id: 'desc' }] });
  }
}

export class PrismaIotRepository implements IotRepository {
  constructor(private readonly prisma: OperationsPrismaClient) {}
  listDevices(input: { siteId: string; cursor?: string; take: number }) {
    return this.prisma.iotDevice.findMany({
      where: { siteId: input.siteId },
      orderBy: { id: 'asc' },
      take: input.take,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    });
  }
}

export class PrismaDepinRepository implements DepinRepository {
  constructor(private readonly prisma: OperationsPrismaClient) {}
  listNodes(input: { siteId: string; cursor?: string; take: number }) {
    return this.prisma.depinNode.findMany({
      where: { siteId: input.siteId },
      orderBy: { id: 'asc' },
      take: input.take,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    });
  }
}

export class PrismaAlarmRepository implements AlarmRepository {
  constructor(private readonly prisma: OperationsPrismaClient) {}
  listAlarms(input: { siteId: string; state?: string; cursor?: string; take: number }) {
    return this.prisma.operationalAlarm.findMany({
      where: { siteId: input.siteId, ...(input.state ? { state: input.state } : {}) },
      orderBy: [{ openedAt: 'desc' }, { id: 'desc' }],
      take: input.take,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    });
  }
}

export class PrismaEventRepository implements EventRepository {
  constructor(private readonly prisma: OperationsPrismaClient) {}
  listEvents(input: { siteId: string; kind?: string; cursor?: string; take: number }) {
    return this.prisma.operationalEvent.findMany({
      where: { siteId: input.siteId, ...(input.kind ? { kind: input.kind } : {}) },
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: input.take,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    });
  }
}

export class PrismaTwinAggregateRepository implements TwinAggregateRepository {
  constructor(private readonly prisma: OperationsPrismaClient) {}
  async counts(siteId: string) {
    const [iotTotal, iotOperational, depinTotal, depinOperational, alarmsOpen, alarmsCritical] = await Promise.all([
      this.prisma.iotDevice.count({ where: { siteId } }),
      this.prisma.iotDevice.count({ where: { siteId, status: 'operational' } }),
      this.prisma.depinNode.count({ where: { siteId } }),
      this.prisma.depinNode.count({ where: { siteId, status: 'operational' } }),
      this.prisma.operationalAlarm.count({ where: { siteId, state: 'open' } }),
      this.prisma.operationalAlarm.count({ where: { siteId, state: 'open', severity: 'critical' } }),
    ]);
    return { iotTotal, iotOperational, depinTotal, depinOperational, alarmsOpen, alarmsCritical };
  }
}
