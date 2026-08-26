import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

function base64urlJson(value: unknown) { return Buffer.from(JSON.stringify(value)).toString('base64url'); }
function sign(input: string, secret: string) { return createHmac('sha256', secret).update(input).digest('base64url'); }

export type SessionTokenClaims = { sid: string; sub: string; iat: number; exp: number };

export function issueOpaqueToken() { return randomBytes(32).toString('base64url'); }

export function issueJwtToken(claims: SessionTokenClaims, secret: string) {
  if (Buffer.byteLength(secret, 'utf8') < 32) throw new Error('JWT_SECRET must contain at least 32 bytes when AUTH_TOKEN_MODE=jwt.');
  const header = base64urlJson({ alg: 'HS256', typ: 'JWT' });
  const payload = base64urlJson(claims);
  const body = `${header}.${payload}`;
  return `${body}.${sign(body, secret)}`;
}

export function verifyJwtToken(token: string, secret: string, nowSeconds = Math.floor(Date.now() / 1000)): SessionTokenClaims {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT structure.');
  const [header, payload, signature] = parts;
  const expected = Buffer.from(sign(`${header}.${payload}`, secret));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('Invalid JWT signature.');
  const decodedHeader = JSON.parse(Buffer.from(header, 'base64url').toString('utf8')) as { alg?: string };
  if (decodedHeader.alg !== 'HS256') throw new Error('Unsupported JWT algorithm.');
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionTokenClaims;
  if (!claims.sid || !claims.sub || !Number.isFinite(claims.exp) || claims.exp <= nowSeconds) throw new Error('JWT session is expired or invalid.');
  return claims;
}
