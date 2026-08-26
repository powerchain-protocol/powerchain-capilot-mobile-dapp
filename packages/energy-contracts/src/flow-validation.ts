import type { IsoTimestamp } from "./common.ts";

export interface LiveFlowBalanceInput {
  generationMw: string;
  demandMw: string;
  gridImportMw: string;
  gridExportMw: string;
  storageChargeMw: string;
  storageDischargeMw: string;
  toleranceMw: string;
}

export interface LiveFlowBalanceValidation {
  valid: boolean;
  authoritative: boolean;
  label: "live" | "simulation" | "non_authoritative";
  varianceMw: string;
  absoluteVarianceMw: string;
  toleranceMw: string;
  calculatedAt: IsoTimestamp;
  equation: "generation + import + discharge - demand - export - charge";
}
