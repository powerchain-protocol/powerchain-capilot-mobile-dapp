import { createHash } from 'node:crypto';

function digest(leftHex: string, rightHex: string) {
  return createHash('sha256').update(Buffer.from(leftHex + rightHex, 'hex')).digest('hex');
}

export function buildReceiptMerkleRoot(receiptHashes: string[]): string | null {
  if (receiptHashes.length === 0) return null;
  let level = receiptHashes.map((hash) => {
    if (!/^[a-f0-9]{64}$/i.test(hash)) throw new TypeError('Invalid receipt hash in Merkle batch.');
    return hash.toLowerCase();
  });
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(digest(level[i]!, level[i + 1] ?? level[i]!));
    }
    level = next;
  }
  return level[0]!;
}
