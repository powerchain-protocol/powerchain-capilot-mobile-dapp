import type { DataMode, EmsOverview } from '@powerchain/operations-contracts';
import { freshness, operationalStatus } from './freshness.ts';

type EmsSnapshotRecord = {
  siteId: string;
  source: string;
  mode: string;
  status: string;
  generationKw: { toString(): string };
  loadKw: { toString(): string };
  storagePowerKw: { toString(): string };
  gridExchangeKw: { toString(): string };
  batterySocPercent: { toString(): string } | null;
  frequencyHz: { toString(): string } | null;
  observedAt: Date;
  receivedAt: Date;
  sequence?: string | null;
};

export interface EmsRepository {
  latestSnapshot(siteId: string): Promise<EmsSnapshotRecord | null>;
}

export class EmsService {
  constructor(private readonly repository: EmsRepository, private readonly maxAgeSeconds: number, private readonly configuredMode: DataMode) {}

  async getOverview(siteId: string): Promise<EmsOverview | null> {
    const row = await this.repository.latestSnapshot(siteId);
    if (!row) return null;
    const mode = row.mode === 'live' || row.mode === 'demo' || row.mode === 'unavailable' ? row.mode : this.configuredMode;
    const observedAt = row.observedAt.toISOString();
    return {
      siteId: row.siteId,
      status: operationalStatus(row.status),
      generation: { value: row.generationKw.toString(), unit: 'kW' },
      load: { value: row.loadKw.toString(), unit: 'kW' },
      storagePower: { value: row.storagePowerKw.toString(), unit: 'kW' },
      gridExchange: { value: row.gridExchangeKw.toString(), unit: 'kW' },
      batterySocPercent: row.batterySocPercent?.toString() ?? null,
      frequencyHz: row.frequencyHz?.toString() ?? null,
      source: {
        source: row.source,
        mode,
        observedAt,
        receivedAt: row.receivedAt.toISOString(),
        freshness: freshness(row.observedAt, this.maxAgeSeconds),
        maxAgeSeconds: this.maxAgeSeconds,
        sequence: row.sequence ?? null,
      },
    };
  }
}
