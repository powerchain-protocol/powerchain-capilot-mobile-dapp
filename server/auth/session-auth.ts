import { createHash } from 'node:crypto';
import { verifyJwtToken } from './tokens.ts';

export type SessionRecord = { id: string; userId: string; expiresAt: Date; revokedAt?: Date | null; tokenHash?: string | null };
export type SessionStore = { findById(id: string): Promise<SessionRecord | null>; findByOpaqueHash(hash: string): Promise<SessionRecord | null> };

export function hashBearerCredential(token: string) { return createHash('sha256').update(token, 'utf8').digest('hex'); }

export function createSessionAuthenticator(input: { mode: 'opaque' | 'jwt'; jwtSecret: string; sessions: SessionStore }) {
  return async function authenticate(request: Request) {
    const auth = request.headers.get('authorization') ?? '';
    if (!auth.startsWith('Bearer ')) return null;
    const token = auth.slice(7).trim();
    if (!token) return null;
    let session: SessionRecord | null;
    if (input.mode === 'jwt') {
      const claims = verifyJwtToken(token, input.jwtSecret);
      session = await input.sessions.findById(claims.sid);
      if (!session || session.userId !== claims.sub) return null;
    } else {
      session = await input.sessions.findByOpaqueHash(hashBearerCredential(token));
    }
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) return null;
    return { userId: session.userId, sessionId: session.id };
  };
}
