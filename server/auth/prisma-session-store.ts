import type { SessionStore, SessionRecord } from './session-auth.ts';

type SessionDelegate = {
  findUnique(input: { where: Record<string, unknown> }): Promise<Record<string, unknown> | null>;
};

function toRecord(row: Record<string, unknown> | null): SessionRecord | null {
  if (!row) return null;
  return {
    id: String(row.id),
    userId: String(row.userId),
    tokenHash: row.tokenHash == null ? null : String(row.tokenHash),
    expiresAt: row.expiresAt instanceof Date ? row.expiresAt : new Date(String(row.expiresAt)),
    revokedAt: row.revokedAt == null ? null : (row.revokedAt instanceof Date ? row.revokedAt : new Date(String(row.revokedAt))),
  };
}

export class PrismaSessionStore implements SessionStore {
  constructor(private readonly sessions: SessionDelegate) {}
  async findById(id: string) { return toRecord(await this.sessions.findUnique({ where: { id } })); }
  async findByOpaqueHash(tokenHash: string) { return toRecord(await this.sessions.findUnique({ where: { tokenHash } })); }
}
