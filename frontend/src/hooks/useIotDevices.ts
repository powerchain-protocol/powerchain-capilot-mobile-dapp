import { useAsyncResource } from "./useAsyncResource";
import { iotService } from "../services/iot";

export function useIotDevices() {
  return useAsyncResource(() => iotService.devices(), []);
}
