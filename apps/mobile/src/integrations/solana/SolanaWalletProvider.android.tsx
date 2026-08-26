import {
  MobileWalletProvider,
  useMobileWallet,
} from "@wallet-ui/react-native-web3js";
import {
  useMemo,
  type PropsWithChildren,
} from "react";
import {
  POWERCHAIN_IDENTITY,
  SOLANA_CHAIN,
  SOLANA_RPC_URL,
} from "./config";
import { SolanaWalletContext } from "./wallet-context";

function Bridge({ children }: PropsWithChildren) {
  const {
    account,
    connect,
    disconnect,
    signMessage,
  } = useMobileWallet();

  const value = useMemo(
    () => ({
      supported: true,
      account: account
        ? {
            address: account.address,
            label: account.label ?? null,
          }
        : null,
      connecting: false,
      connect,
      disconnect,
      signMessage,
    }),
    [account, connect, disconnect, signMessage],
  );

  return (
    <SolanaWalletContext.Provider value={value}>
      {children}
    </SolanaWalletContext.Provider>
  );
}

export function SolanaWalletProvider({
  children,
}: PropsWithChildren) {
  return (
    <MobileWalletProvider
      chain={SOLANA_CHAIN}
      endpoint={SOLANA_RPC_URL}
      identity={POWERCHAIN_IDENTITY}
    >
      <Bridge>{children}</Bridge>
    </MobileWalletProvider>
  );
}
