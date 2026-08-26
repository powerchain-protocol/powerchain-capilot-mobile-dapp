import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify } from 'node:crypto';

export type ReceiptSignature = { signature: string; keyId: string; publicKeyPem: string };
export type ReceiptSigner = {
  keyId: string;
  publicKeyPem: string;
  signReceiptHash(receiptHash: string): string;
};

function assertHash(hash: string) {
  if (!/^[a-f0-9]{64}$/i.test(hash)) throw new TypeError('receiptHash must be a 64-character SHA-256 hex digest.');
}

export function createEd25519ReceiptSigner(input: { privateKeyPem: string; keyId: string }): ReceiptSigner {
  const keyId = input.keyId.trim();
  if (!keyId) throw new TypeError('Receipt signing key id is required.');
  const privateKey = createPrivateKey(input.privateKeyPem);
  if (privateKey.asymmetricKeyType !== 'ed25519') throw new TypeError('PWRC receipt signing key must be Ed25519.');
  const publicKeyPem = createPublicKey(privateKey).export({ type: 'spki', format: 'pem' }).toString();
  return {
    keyId,
    publicKeyPem,
    signReceiptHash(receiptHash) {
      assertHash(receiptHash);
      return `ed25519:${keyId}:${sign(null, Buffer.from(receiptHash, 'hex'), privateKey).toString('base64url')}`;
    },
  };
}

export function createEphemeralDevelopmentReceiptSigner(): ReceiptSigner {
  if (process.env.NODE_ENV === 'production') throw new Error('Ephemeral PWRC receipt signing is disabled in production.');
  const { privateKey } = generateKeyPairSync('ed25519');
  return createEd25519ReceiptSigner({
    privateKeyPem: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    keyId: 'development-ephemeral',
  });
}

export function verifyReceiptSignature(input: { receiptHash: string; signature: string; publicKeyPem: string }) {
  assertHash(input.receiptHash);
  const parts = input.signature.split(':');
  if (parts.length !== 3 || parts[0] !== 'ed25519') return false;
  try {
    return verify(null, Buffer.from(input.receiptHash, 'hex'), createPublicKey(input.publicKeyPem), Buffer.from(parts[2]!, 'base64url'));
  } catch {
    return false;
  }
}
