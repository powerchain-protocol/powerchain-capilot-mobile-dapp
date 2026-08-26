import { useAsyncResource } from "./useAsyncResource";
import { depinService } from "../services/depin";

export function useDepinNodes() {
  return useAsyncResource(() => depinService.nodes(), []);
}
