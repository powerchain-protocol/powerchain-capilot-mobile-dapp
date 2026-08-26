import { SuiRpcClient } from "@powerchain/platform-clients/sui";
import { mobileEnv } from "../../config/env";

export const platformSuiRpc = new SuiRpcClient({
  rpcUrl: mobileEnv.suiRpcUrl,
});
