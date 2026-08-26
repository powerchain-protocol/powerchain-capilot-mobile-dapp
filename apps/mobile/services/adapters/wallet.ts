import type { NetworkName, WalletIdentity } from '@/types/operations';

export type WalletSignRequest = {
  network: NetworkName;
  payload: string;
  encoding: 'base64' | 'utf8';
  purpose: string;
};

export type WalletSignResult = {
  wallet: WalletIdentity;
  signature: string;
};

export interface WalletAdapter {
  listWallets(): Promise<WalletIdentity[]>;
  getActiveWallet(network: NetworkName): Promise<WalletIdentity | null>;
  signMessage(request: WalletSignRequest): Promise<WalletSignResult>;
}

export class WalletUnavailableError extends Error {
  constructor(message = 'No compatible wallet adapter is connected.') {
    super(message);
    this.name = 'WalletUnavailableError';
  }
}

export const unavailableWalletAdapter: WalletAdapter = {
  async listWallets() { return []; },
  async getActiveWallet() { return null; },
  async signMessage() { throw new WalletUnavailableError(); },
};
