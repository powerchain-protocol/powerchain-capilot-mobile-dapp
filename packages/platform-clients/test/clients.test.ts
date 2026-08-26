import test from "node:test";
import assert from "node:assert/strict";
import { SolanaRpcClient, SuiRpcClient } from "../src/index.ts";

test("Solana client emits JSON-RPC without provider lock-in", async () => {
  let body = "";
  const client = new SolanaRpcClient({
    rpcUrl: "https://rpc.example",
    fetcher: async (_url, init) => {
      body = String(init?.body ?? "");
      return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: "ok" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });
  assert.equal(await client.getHealth(), "ok");
  assert.match(body, /getHealth/);
});

test("Sui client uses generic JSON-RPC transport", async () => {
  const client = new SuiRpcClient({
    rpcUrl: "https://sui.example",
    fetcher: async () =>
      new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: "42" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
  });
  assert.equal(await client.getLatestCheckpointSequenceNumber(), "42");
});
