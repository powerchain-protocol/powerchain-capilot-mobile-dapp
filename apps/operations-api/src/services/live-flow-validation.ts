import type { LiveFlowBalanceInput, LiveFlowBalanceValidation } from "@powerchain/energy-contracts";
import { absBigInt, decimalToScaledInt, scaledIntToDecimal } from "../lib/decimal.js";
import { config } from "../config.js";

const SCALE = 9;

export function validateLiveFlow(input: LiveFlowBalanceInput, label: LiveFlowBalanceValidation["label"]): LiveFlowBalanceValidation {
  const generation = decimalToScaledInt(input.generationMw, SCALE);
  const demand = decimalToScaledInt(input.demandMw, SCALE);
  const gridImport = decimalToScaledInt(input.gridImportMw, SCALE);
  const gridExport = decimalToScaledInt(input.gridExportMw, SCALE);
  const storageCharge = decimalToScaledInt(input.storageChargeMw, SCALE);
  const storageDischarge = decimalToScaledInt(input.storageDischargeMw, SCALE);
  const tolerance = decimalToScaledInt(input.toleranceMw || config.LIVE_FLOW_TOLERANCE_MW, SCALE);
  const variance = generation + gridImport + storageDischarge - demand - gridExport - storageCharge;
  const absolute = absBigInt(variance);
  return {
    valid: absolute <= absBigInt(tolerance),
    authoritative: label === "live",
    label,
    varianceMw: scaledIntToDecimal(variance, SCALE),
    absoluteVarianceMw: scaledIntToDecimal(absolute, SCALE),
    toleranceMw: scaledIntToDecimal(absBigInt(tolerance), SCALE),
    calculatedAt: new Date().toISOString(),
    equation: "generation + import + discharge - demand - export - charge",
  };
}
