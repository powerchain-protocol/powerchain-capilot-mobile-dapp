import { useAsyncResource } from "./useAsyncResource";
import { emsService } from "../services/ems";

export function useEmsOverview() {
  return useAsyncResource(() => emsService.overview(), []);
}

export function useEnergyFlow() {
  return useAsyncResource(() => emsService.flow(), []);
}
