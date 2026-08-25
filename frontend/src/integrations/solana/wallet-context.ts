import { createContext, useContext } from "react";

export type SolanaWalletAccount = {
  address: string;
  label?: string | null;
};

export type SolanaWalletContextValue = {
  supported: boolean;
  account: SolanaWalletAccount | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
};

export const SolanaWalletContext =
  createContext<SolanaWalletContextValue | null>(null);

export function useSolanaWallet() {
  const context = useContext(SolanaWalletContext);
  if (!context) {
    throw new Error(
      "useSolanaWallet must be used inside SolanaWalletProvider",
    );
  }
  return context;
}
