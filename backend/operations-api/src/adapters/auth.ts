import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import type { AuthPrincipal } from '@powerchain/operations-contracts';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface OperationsAuthAdapter {
  authenticate(request: Request): Promise<AuthPrincipal | null>;
}

function safeSecretEqual(expected: string, supplied: string) {
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(supplied, 'utf8');
  if (!a.length || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function hasInternalBearer(request: Request, secret: string) {
  const header = request.header('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  return safeSecretEqual(secret, token);
}

export class InternalBearerAuthAdapter implements OperationsAuthAdapter {
  constructor(private readonly secret: string) {}
  async authenticate(request: Request): Promise<AuthPrincipal | null> {
    if (!hasInternalBearer(request, this.secret)) return null;
    const userId = request.header('x-powerchain-user-id')?.trim();
    if (!userId || userId.length > 128 || !/^[A-Za-z0-9._:@-]+$/.test(userId)) return null;
    const organizationId = request.header('x-powerchain-organization-id')?.trim() || null;
    const roles = (request.header('x-powerchain-roles') || '').split(',').map((value) => value.trim()).filter((value) => /^[A-Za-z0-9._:-]{1,64}$/.test(value)).slice(0, 32);
    return { userId, organizationId, roles };
  }
}

export class SupabaseAuthAdapter implements OperationsAuthAdapter {
  constructor(private readonly supabase: SupabaseClient) {}
  async authenticate(request: Request): Promise<AuthPrincipal | null> {
    const header = request.header('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) return null;
    const { data, error } = await this.supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return { userId: data.user.id, organizationId: null, roles: [] };
  }
}
