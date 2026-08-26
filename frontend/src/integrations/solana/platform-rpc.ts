import { SolanaRpcClient } from "@powerchain/platform-clients/solana";
import { mobileEnv } from "../../config/env";

export const platformSolanaRpc = new SolanaRpcClient({
  rpcUrl: mobileEnv.solanaRpcUrl,
  commitment: "confirmed",
});
