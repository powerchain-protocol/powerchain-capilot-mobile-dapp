import { createHash } from 'node:crypto';
import { decryptSetting, encryptSetting } from '../../security/settings-crypto.ts';
import type { AiMemoryKind, AiMemoryProvider, AiMemoryRecord } from './types.ts';

const KINDS = new Set<AiMemoryKind>(['preference', 'context', 'decision', 'summary']);
const SECRET_PATTERN = /(?:api[_ -]?key|password|private[_ -]?key|seed phrase|mnemonic|bearer\s+[a-z0-9._-]+)/i;

type MemoryDelegate = { findMany(args: unknown): Promise<any[]>; create(args: unknown): Promise<any>; deleteMany(args: unknown): Promise<any> };

export class PrismaAiMemoryService implements AiMemoryProvider {
  constructor(private readonly memories: MemoryDelegate, private readonly encryptionKey: string) {}

  async remember(input: { userId: string; conversationId?: string; kind: AiMemoryKind; content: string }): Promise<AiMemoryRecord> {
    if (!KINDS.has(input.kind)) throw new Error('Unsupported memory kind.');
    const content = input.content.replace(/\s+/g, ' ').trim();
    if (!content || content.length > 1_500) throw new Error('Memory must contain 1..1500 characters.');
    if (SECRET_PATTERN.test(content)) throw new Error('Potential credentials cannot be stored in AI memory.');
    const contentHash = createHash('sha256').update(`${input.kind}\n${content}`, 'utf8').digest('hex');
    const row = await this.memories.create({ data: { userId: input.userId, conversationId: input.conversationId ?? null, kind: input.kind, contentCiphertext: encryptSetting(content, this.encryptionKey), contentHash } });
    return { id: row.id, kind: row.kind as AiMemoryKind, content, createdAt: row.createdAt, updatedAt: row.updatedAt };
  }

  async listMemories(input: { userId: string; conversationId?: string; limit?: number }) {
    const rows = await this.memories.findMany({
      where: { userId: input.userId, OR: [{ conversationId: null }, ...(input.conversationId ? [{ conversationId: input.conversationId }] : [])] },
      orderBy: { updatedAt: 'desc' },
      take: Math.min(100, Math.max(1, input.limit ?? 32)),
    });
    return rows.map((row) => ({
      id: row.id,
      kind: row.kind as AiMemoryKind,
      content: decryptSetting(row.contentCiphertext, this.encryptionKey),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async getGrounding(input: { userId: string; conversationId?: string; limit?: number }) {
    const rows = await this.memories.findMany({
      where: { userId: input.userId, OR: [{ conversationId: null }, ...(input.conversationId ? [{ conversationId: input.conversationId }] : [])] },
      orderBy: { updatedAt: 'desc' },
      take: Math.min(32, Math.max(1, input.limit ?? 12)),
    });
    return rows.map((row) => ({ kind: row.kind as AiMemoryKind, content: decryptSetting(row.contentCiphertext, this.encryptionKey) }));
  }

  async forget(userId: string, memoryId: string) {
    await this.memories.deleteMany({ where: { userId, id: memoryId } });
  }

  async forgetConversation(userId: string, conversationId: string) {
    await this.memories.deleteMany({ where: { userId, conversationId } });
  }
}
