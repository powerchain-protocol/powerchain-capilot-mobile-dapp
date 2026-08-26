export type WalletChain = "solana" | "sui";
export type WalletCapability = "connect" | "sign_message" | "sign_transaction";

export interface WalletAccount {
  chain: WalletChain;
  address: string;
  walletName?: string;
  capabilities: WalletCapability[];
}

export interface WalletAdapter {
  chain: WalletChain;
  connect(): Promise<WalletAccount>;
  disconnect(): Promise<void>;
  getAccount(): Promise<WalletAccount | null>;
  signMessage?(message: Uint8Array): Promise<Uint8Array>;
  signTransaction?(transaction: Uint8Array): Promise<Uint8Array>;
}
