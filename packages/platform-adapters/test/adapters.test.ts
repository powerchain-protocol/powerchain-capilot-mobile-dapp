import test from "node:test";
import assert from "node:assert/strict";
import { createSolanaWalletAdapter } from "../src/index.ts";

test("wallet adapter keeps provider transport behind a chain-neutral contract", async () => {
  const adapter = createSolanaWalletAdapter({
    async connect() {
      return {
        chain: "solana",
        address: "Address111",
        capabilities: ["connect", "sign_message"],
      };
    },
    async disconnect() {},
    async getAccount() {
      return null;
    },
    async signMessage(message) {
      return message;
    },
  });
  assert.equal(adapter.chain, "solana");
  assert.equal((await adapter.connect()).address, "Address111");
});
