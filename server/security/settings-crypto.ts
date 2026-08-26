import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

function normalizeKey(secret: string) {
  if (!secret.trim()) throw new Error('SETTINGS_ENCRYPTION_KEY is required for protected settings.');
  return createHash('sha256').update(secret, 'utf8').digest();
}

export function encryptSetting(plaintext: string, secret: string) {
  const key = normalizeKey(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join('.');
}

export function decryptSetting(value: string, secret: string) {
  const [version, ivPart, tagPart, ciphertextPart] = value.split('.');
  if (version !== 'v1' || !ivPart || !tagPart || !ciphertextPart) throw new Error('Invalid encrypted setting envelope.');
  const key = normalizeKey(secret);
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivPart, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextPart, 'base64url')), decipher.final()]).toString('utf8');
}
