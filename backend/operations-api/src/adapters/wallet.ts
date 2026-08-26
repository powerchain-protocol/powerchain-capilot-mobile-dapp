import type { WalletIdentity } from '@powerchain/operations-contracts';

export interface WalletRegistryAdapter {
  listWallets(userId: string): Promise<WalletIdentity[]>;
  getPrimaryWallet(userId: string, network: 'solana' | 'sui'): Promise<WalletIdentity | null>;
}

import type { OperationsPrismaClient } from '../db/prisma.ts';

type WalletRecordReader = OperationsPrismaClient['operationalWallet'];

function normalizeWallet(record: { id: string; address: string; network: string; label: string | null; isPrimary: boolean }): WalletIdentity {
  if (record.network !== 'solana' && record.network !== 'sui') throw new Error(`Unsupported wallet network: ${record.network}`);
  return { id: record.id, address: record.address, network: record.network, label: record.label ?? undefined, isPrimary: record.isPrimary };
}

export class PrismaWalletRegistryAdapter implements WalletRegistryAdapter {
  constructor(private readonly wallets: WalletRecordReader) {}
  async listWallets(userId: string) {
    return (await this.wallets.findMany({ where: { userId }, orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] })).map(normalizeWallet);
  }
  async getPrimaryWallet(userId: string, network: 'solana' | 'sui') {
    const record = await this.wallets.findFirst({ where: { userId, network }, orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] });
    return record ? normalizeWallet(record) : null;
  }
}
