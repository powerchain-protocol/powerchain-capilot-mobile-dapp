import { createHash, randomUUID } from 'node:crypto';
import { encryptSetting, decryptSetting } from '../security/settings-crypto.ts';
import { slugify } from '../../shared/utils/slug.ts';
import type { ChatConversationSummary, ChatPersistence, ChatRole, PersistedChatMessage } from './types.ts';

const MAX_MESSAGE_CHARS = 8_000;

function normalizeContent(value: string) {
  const content = value.replace(/\u0000/g, '').trim();
  if (!content) throw new Error('Message content is required.');
  if (content.length > MAX_MESSAGE_CHARS) throw new Error(`Message content must be ${MAX_MESSAGE_CHARS} characters or fewer.`);
  return content;
}

function hashContent(value: string) { return createHash('sha256').update(value, 'utf8').digest('hex'); }
function titleFromSeed(seed = 'New analysis') { return seed.replace(/\s+/g, ' ').trim().slice(0, 80) || 'New analysis'; }

type ConversationDelegate = {
  findFirst(args: unknown): Promise<any>;
  findMany(args: unknown): Promise<any[]>;
  create(args: unknown): Promise<any>;
  update(args: unknown): Promise<any>;
};
type MessageDelegate = { findMany(args: unknown): Promise<any[]>; create(args: unknown): Promise<any> };

export class PrismaEncryptedChatService implements ChatPersistence {
  constructor(
    private readonly conversations: ConversationDelegate,
    private readonly messages: MessageDelegate,
    private readonly encryptionKey: string,
  ) {}

  async ensureConversation(input: { userId: string; conversationId?: string; titleSeed?: string }): Promise<ChatConversationSummary> {
    if (input.conversationId) {
      const existing = await this.conversations.findFirst({ where: { id: input.conversationId, userId: input.userId } });
      if (!existing) throw new Error('Conversation not found.');
      return existing;
    }
    const title = titleFromSeed(input.titleSeed);
    const suffix = randomUUID().slice(0, 8);
    return this.conversations.create({ data: { userId: input.userId, slug: `${slugify(title, 'analysis')}-${suffix}`, title } });
  }

  async appendMessage(input: { userId: string; conversationId: string; role: ChatRole; content: string; provider?: string; model?: string; reservationId?: string; messageUnitId?: string; receiptId?: string; receiptHash?: string; pwrcDebitBaseUnits?: string; referenceValueUsd?: string }): Promise<PersistedChatMessage> {
    const conversation = await this.conversations.findFirst({ where: { id: input.conversationId, userId: input.userId }, select: { id: true } });
    if (!conversation) throw new Error('Conversation not found.');
    const content = normalizeContent(input.content);
    const row = await this.messages.create({ data: {
      userId: input.userId,
      conversationId: input.conversationId,
      role: input.role,
      contentCiphertext: encryptSetting(content, this.encryptionKey),
      contentHash: hashContent(content),
      provider: input.provider ?? null,
      model: input.model ?? null,
      reservationId: input.reservationId ?? null,
      messageUnitId: input.messageUnitId ?? null,
      receiptId: input.receiptId ?? null,
      receiptHash: input.receiptHash ?? null,
      pwrcDebitBaseUnits: input.pwrcDebitBaseUnits ?? null,
      referenceValueUsd: input.referenceValueUsd ?? null,
    } });
    await this.conversations.update({ where: { id: input.conversationId }, data: { updatedAt: new Date() } });
    return {
      id: row.id, conversationId: row.conversationId, role: row.role, content, contentHash: row.contentHash,
      createdAt: row.createdAt, provider: row.provider ?? null, model: row.model ?? null, reservationId: row.reservationId ?? null,
      messageUnitId: row.messageUnitId ?? null, receiptId: row.receiptId ?? null, receiptHash: row.receiptHash ?? null,
      pwrcDebitBaseUnits: row.pwrcDebitBaseUnits ?? null, referenceValueUsd: row.referenceValueUsd ?? null,
    };
  }

  async listConversations(userId: string, limit: number) {
    return this.conversations.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' }, take: Math.min(100, Math.max(1, limit)), select: { id: true, slug: true, title: true, createdAt: true, updatedAt: true } });
  }

  async listMessages(userId: string, conversationId: string, limit: number) {
    const conversation = await this.conversations.findFirst({ where: { id: conversationId, userId }, select: { id: true } });
    if (!conversation) throw new Error('Conversation not found.');
    const rows = await this.messages.findMany({ where: { userId, conversationId }, orderBy: { createdAt: 'asc' }, take: Math.min(500, Math.max(1, limit)) });
    return rows.map((row) => ({
      id: row.id, conversationId: row.conversationId, role: row.role,
      content: decryptSetting(row.contentCiphertext, this.encryptionKey), contentHash: row.contentHash,
      createdAt: row.createdAt, provider: row.provider ?? null, model: row.model ?? null, reservationId: row.reservationId ?? null,
      messageUnitId: row.messageUnitId ?? null, receiptId: row.receiptId ?? null, receiptHash: row.receiptHash ?? null,
      pwrcDebitBaseUnits: row.pwrcDebitBaseUnits ?? null, referenceValueUsd: row.referenceValueUsd ?? null,
    }));
  }
}
