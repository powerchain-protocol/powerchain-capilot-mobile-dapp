import bs58 from "bs58";
import { apiFetch } from "../../api/client";
import { useSolanaWallet } from "./wallet-context";

export type WalletChallenge = {
  id: string;
  address: string;
  message: string;
  expiresAt: string;
};

export async function createWalletChallenge(address: string) {
  return apiFetch<WalletChallenge>("/wallets/challenge", {
    method: "POST",
    body: JSON.stringify({ address }),
  });
}

export async function submitWalletSignature(input: {
  challengeId: string;
  address: string;
  signature: Uint8Array;
}) {
  return apiFetch<{
    id: string;
    address: string;
    verifiedAt: string;
  }>("/wallets/verify", {
    method: "POST",
    body: JSON.stringify({
      challengeId: input.challengeId,
      address: input.address,
      signatureBase58: bs58.encode(input.signature),
    }),
  });
}

export async function verifyConnectedWallet(input: {
  address: string;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}) {
  const challenge = await createWalletChallenge(input.address);
  const signature = await input.signMessage(
    new TextEncoder().encode(challenge.message),
  );

  return submitWalletSignature({
    challengeId: challenge.id,
    address: input.address,
    signature,
  });
}
