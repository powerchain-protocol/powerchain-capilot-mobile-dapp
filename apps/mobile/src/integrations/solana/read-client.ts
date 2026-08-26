import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { SOLANA_RPC_URL } from "./config";

export const solanaConnection = new Connection(
  SOLANA_RPC_URL,
  "confirmed",
);

export async function getSolBalance(address: string) {
  const publicKey = new PublicKey(address);
  const lamports = await solanaConnection.getBalance(publicKey, "confirmed");
  return {
    lamports,
    sol: lamports / LAMPORTS_PER_SOL,
  };
}

export async function getTokenAccounts(address: string) {
  const owner = new PublicKey(address);

  const response =
    await solanaConnection.getParsedTokenAccountsByOwner(owner, {
      programId: new PublicKey(
        "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
      ),
    });

  return response.value.map(({ pubkey, account }) => {
    const parsed = account.data as {
      parsed?: {
        info?: {
          mint?: string;
          tokenAmount?: {
            amount?: string;
            decimals?: number;
            uiAmountString?: string;
          };
        };
      };
    };

    return {
      account: pubkey.toBase58(),
      mint: parsed.parsed?.info?.mint ?? "",
      amount: parsed.parsed?.info?.tokenAmount?.amount ?? "0",
      decimals: parsed.parsed?.info?.tokenAmount?.decimals ?? 0,
      uiAmount:
        parsed.parsed?.info?.tokenAmount?.uiAmountString ?? "0",
    };
  });
}
