import { randomUUID } from 'node:crypto';
import { hashBearerCredential } from './session-auth.ts';
import { issueJwtToken, issueOpaqueToken } from './tokens.ts';

export type SessionWriteDelegate = {
  create(input: { data: Record<string, unknown> }): Promise<Record<string, unknown>>;
  updateMany(input: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<{ count: number }>;
};

export class SessionService {
  constructor(
    private readonly sessions: SessionWriteDelegate,
    private readonly config: { mode: 'opaque' | 'jwt'; jwtSecret: string; ttlDays: number },
  ) {}

  async issueForVerifiedUser(userId: string, now = new Date()) {
    if (!userId.trim()) throw new Error('Verified user id is required.');
    const id = randomUUID();
    const issuedAt = Math.floor(now.getTime() / 1000);
    const expiresAt = new Date(now.getTime() + this.config.ttlDays * 86_400_000);
    const token = this.config.mode === 'jwt'
      ? issueJwtToken({ sid: id, sub: userId, iat: issuedAt, exp: Math.floor(expiresAt.getTime() / 1000) }, this.config.jwtSecret)
      : issueOpaqueToken();
    await this.sessions.create({
      data: {
        id,
        userId,
        tokenHash: this.config.mode === 'opaque' ? hashBearerCredential(token) : null,
        expiresAt,
        revokedAt: null,
        createdAt: now,
      },
    });
    return { sessionId: id, userId, accessToken: token, tokenMode: this.config.mode, expiresAt };
  }

  async revoke(userId: string, sessionId: string, now = new Date()) {
    const result = await this.sessions.updateMany({ where: { id: sessionId, userId, revokedAt: null }, data: { revokedAt: now } });
    return result.count > 0;
  }
}
