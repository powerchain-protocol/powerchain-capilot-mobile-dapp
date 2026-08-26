import type {
  ApiEnvelope,
  DispatchPreview,
  DispatchPreviewRequest,
  EmsOverview,
  EnergyFlowSnapshot,
} from "@powerchain/energy-contracts";
import { energyApiFetch } from "../../api/energy-client";

export const emsService = {
  overview() {
    return energyApiFetch<ApiEnvelope<EmsOverview>>("/ems/overview").then((response) => response.data);
  },
  flow() {
    return energyApiFetch<ApiEnvelope<EnergyFlowSnapshot>>("/ems/flow").then((response) => response.data);
  },
  previewDispatch(input: DispatchPreviewRequest) {
    return energyApiFetch<ApiEnvelope<DispatchPreview>>("/ems/dispatch/preview", {
      method: "POST",
      body: JSON.stringify(input),
    }).then((response) => response.data);
  },
};
