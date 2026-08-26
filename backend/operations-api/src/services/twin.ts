import type { FreshnessState, OperationalStatus, OperationalTwin, TelemetryIntegrityReport } from '@powerchain/operations-contracts';
import type { EmsService } from './ems.ts';

export interface TwinAggregateRepository {
  counts(siteId: string): Promise<{ iotTotal: number; iotOperational: number; depinTotal: number; depinOperational: number; alarmsOpen: number; alarmsCritical: number }>;
}

function worstStatus(input: { ems: OperationalStatus; critical: number; offlineAssets: number }): OperationalStatus {
  if (input.ems === 'offline' || input.critical > 0) return 'offline';
  if (input.ems === 'degraded' || input.offlineAssets > 0) return 'degraded';
  if (input.ems === 'unknown') return 'unknown';
  return 'operational';
}

export class TwinService {
  constructor(private readonly ems: EmsService, private readonly aggregate: TwinAggregateRepository) {}

  async get(siteId: string): Promise<OperationalTwin> {
    const [overview, counts] = await Promise.all([this.ems.getOverview(siteId), this.aggregate.counts(siteId)]);
    const offlineAssets = (counts.iotTotal - counts.iotOperational) + (counts.depinTotal - counts.depinOperational);
    const sourceFreshness: FreshnessState = overview?.source.freshness ?? 'unknown';
    return {
      siteId,
      status: worstStatus({ ems: overview?.status ?? 'unknown', critical: counts.alarmsCritical, offlineAssets }),
      telemetry: {
        generationKw: overview?.generation.value ?? null,
        loadKw: overview?.load.value ?? null,
        gridExchangeKw: overview?.gridExchange.value ?? null,
        batterySocPercent: overview?.batterySocPercent ?? null,
        frequencyHz: overview?.frequencyHz ?? null,
      },
      assets: {
        iotTotal: counts.iotTotal,
        iotOperational: counts.iotOperational,
        depinTotal: counts.depinTotal,
        depinOperational: counts.depinOperational,
      },
      alarms: { open: counts.alarmsOpen, critical: counts.alarmsCritical },
      computedAt: new Date().toISOString(),
      sourceFreshness,
    };
  }

  async integrity(siteId: string): Promise<TelemetryIntegrityReport> {
    const [overview, counts] = await Promise.all([this.ems.getOverview(siteId), this.aggregate.counts(siteId)]);
    const freshness = overview?.source.freshness ?? 'unknown';
    const iotRatio = counts.iotTotal > 0 ? counts.iotOperational / counts.iotTotal : null;
    const depinRatio = counts.depinTotal > 0 ? counts.depinOperational / counts.depinTotal : null;
    const checks: TelemetryIntegrityReport['checks'] = [
      {
        name: 'telemetry_freshness',
        status: freshness === 'fresh' ? 'ok' : freshness === 'stale' ? 'warning' : 'unknown',
        detail: freshness === 'fresh' ? 'Latest EMS telemetry is within the configured freshness window.' : freshness === 'stale' ? 'Latest EMS telemetry is stale and must not be treated as live.' : 'No authoritative EMS freshness state is available.',
      },
      {
        name: 'iot_availability',
        status: iotRatio == null ? 'unknown' : iotRatio >= 0.95 ? 'ok' : iotRatio >= 0.75 ? 'warning' : 'failed',
        detail: counts.iotTotal ? `${counts.iotOperational}/${counts.iotTotal} IoT devices are operational.` : 'No IoT devices are registered for this site.',
      },
      {
        name: 'depin_availability',
        status: depinRatio == null ? 'unknown' : depinRatio >= 0.95 ? 'ok' : depinRatio >= 0.75 ? 'warning' : 'failed',
        detail: counts.depinTotal ? `${counts.depinOperational}/${counts.depinTotal} DePIN nodes are operational.` : 'No DePIN nodes are registered for this site.',
      },
      {
        name: 'critical_alarms',
        status: counts.alarmsCritical > 0 ? 'failed' : counts.alarmsOpen > 0 ? 'warning' : 'ok',
        detail: counts.alarmsCritical > 0 ? `${counts.alarmsCritical} critical open alarm(s) require attention.` : counts.alarmsOpen > 0 ? `${counts.alarmsOpen} open non-critical alarm(s) remain.` : 'No open operational alarms are reported.',
      },
    ];
    const hasFailed = checks.some((check) => check.status === 'failed');
    const hasWarning = checks.some((check) => check.status === 'warning');
    const allUnknown = checks.every((check) => check.status === 'unknown');
    return {
      siteId,
      state: allUnknown ? 'insufficient_data' : hasFailed || hasWarning ? 'degraded' : 'healthy',
      freshness,
      observedAt: overview?.source.observedAt ?? null,
      computedAt: new Date().toISOString(),
      checks,
    };
  }
}
