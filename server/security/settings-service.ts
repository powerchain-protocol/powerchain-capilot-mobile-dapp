import { decryptSetting, encryptSetting } from './settings-crypto.ts';

export type SettingsDelegate = {
  upsert(input: { where: Record<string, unknown>; create: Record<string, unknown>; update: Record<string, unknown> }): Promise<Record<string, unknown>>;
  findUnique(input: { where: Record<string, unknown> }): Promise<Record<string, unknown> | null>;
};

export class EncryptedSettingsService {
  constructor(private readonly settings: SettingsDelegate, private readonly encryptionKey: string) {}

  async set(userId: string, key: string, plaintext: string) {
    const encryptedValue = encryptSetting(plaintext, this.encryptionKey);
    await this.settings.upsert({
      where: { userId_key: { userId, key } },
      create: { userId, key, encryptedValue },
      update: { encryptedValue },
    });
  }

  async get(userId: string, key: string) {
    const row = await this.settings.findUnique({ where: { userId_key: { userId, key } } });
    if (!row) return null;
    return decryptSetting(String(row.encryptedValue), this.encryptionKey);
  }
}
