import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { createHash } from 'node:crypto';

export const MCP_LIMITS = Object.freeze({
  maxTools: 64,
  maxToolCalls: 8,
  maxArgumentBytes: 32 * 1024,
  maxResultBytes: 256 * 1024,
  maxSchemaBytes: 48 * 1024,
  maxDescriptionChars: 2_000,
});

const CREDENTIAL_KEY = /(api[_-]?key|secret|password|passwd|token|authorization|cookie|private[_-]?key|seed|mnemonic)/i;

function isPrivateIpv4(address: string) {
  const octets = address.split('.').map(Number);
  const [a, b] = octets;
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase();
  return normalized === '::' || normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb');
}

export async function assertSafeMcpUrl(raw: string, allowedHosts: Set<string>, production = process.env.NODE_ENV === 'production') {
  const url = new URL(raw);
  if (production && url.protocol !== 'https:') throw new Error('Production MCP servers must use HTTPS.');
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Unsupported MCP URL protocol.');
  if (url.username || url.password) throw new Error('MCP URLs must not contain credentials.');
  if (!allowedHosts.has(url.hostname)) throw new Error(`MCP hostname is not allowlisted: ${url.hostname}`);
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  for (const entry of addresses) {
    if ((isIP(entry.address) === 4 && isPrivateIpv4(entry.address)) || (isIP(entry.address) === 6 && isPrivateIpv6(entry.address))) {
      throw new Error(`MCP hostname resolves to a private or reserved address: ${url.hostname}`);
    }
  }
  return url;
}

export function normalizeToolDescription(value: unknown) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MCP_LIMITS.maxDescriptionChars);
}

export function assertSchemaSize(schema: unknown) {
  const bytes = Buffer.byteLength(JSON.stringify(schema ?? {}), 'utf8');
  if (bytes > MCP_LIMITS.maxSchemaBytes) throw new Error('MCP tool schema exceeds size limit.');
}

export function assertArgumentsSafe(args: Record<string, unknown>) {
  const encoded = JSON.stringify(args);
  if (Buffer.byteLength(encoded, 'utf8') > MCP_LIMITS.maxArgumentBytes) throw new Error('MCP arguments exceed size limit.');
  const walk = (value: unknown) => {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (CREDENTIAL_KEY.test(key)) throw new Error(`Credential-like argument field is blocked: ${key}`);
      walk(child);
    }
  };
  walk(args);
}

export function normalizeMcpResult(value: unknown) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  if (Buffer.byteLength(text, 'utf8') > MCP_LIMITS.maxResultBytes) throw new Error('MCP result exceeds size limit.');
  return { output: text, resultHash: createHash('sha256').update(text).digest('hex') };
}
