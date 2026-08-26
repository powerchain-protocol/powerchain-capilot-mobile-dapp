import type {
  WalletAccount,
  WalletAdapter,
  WalletChain,
} from "@powerchain/energy-contracts";

export interface WalletTransport {
  chain: WalletChain;
  connect(): Promise<WalletAccount>;
  disconnect(): Promise<void>;
  getAccount(): Promise<WalletAccount | null>;
  signMessage?(message: Uint8Array): Promise<Uint8Array>;
  signTransaction?(transaction: Uint8Array): Promise<Uint8Array>;
}

export class ProviderNeutralWalletAdapter implements WalletAdapter {
  constructor(private readonly transport: WalletTransport) {}

  get chain() {
    return this.transport.chain;
  }

  connect() {
    return this.transport.connect();
  }

  disconnect() {
    return this.transport.disconnect();
  }

  getAccount() {
    return this.transport.getAccount();
  }

  signMessage(message: Uint8Array) {
    if (!this.transport.signMessage) {
      throw new Error(`WALLET_SIGN_MESSAGE_UNSUPPORTED:${this.chain}`);
    }
    return this.transport.signMessage(message);
  }

  signTransaction(transaction: Uint8Array) {
    if (!this.transport.signTransaction) {
      throw new Error(`WALLET_SIGN_TRANSACTION_UNSUPPORTED:${this.chain}`);
    }
    return this.transport.signTransaction(transaction);
  }
}

export function createSolanaWalletAdapter(transport: Omit<WalletTransport, "chain">) {
  return new ProviderNeutralWalletAdapter({ ...transport, chain: "solana" });
}

export function createSuiWalletAdapter(transport: Omit<WalletTransport, "chain">) {
  return new ProviderNeutralWalletAdapter({ ...transport, chain: "sui" });
}
