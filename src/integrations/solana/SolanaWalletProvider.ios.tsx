import type { PropsWithChildren } from "react";
import { SolanaWalletContext } from "./wallet-context";

export function SolanaWalletProvider({
  children,
}: PropsWithChildren) {
  return (
    <SolanaWalletContext.Provider
      value={{
        supported: false,
        account: null,
        connecting: false,
        connect: async () => {
          throw new Error(
            "Solana Mobile Wallet Adapter is not available on iOS.",
          );
        },
        disconnect: async () => {},
        signMessage: async () => {
          throw new Error(
            "Message signing is not available through MWA on iOS.",
          );
        },
      }}
    >
      {children}
    </SolanaWalletContext.Provider>
  );
}
