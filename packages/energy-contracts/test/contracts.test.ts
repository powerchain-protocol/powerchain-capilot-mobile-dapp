import test from "node:test";
import assert from "node:assert/strict";
import type { DispatchPreviewRequest, SafeActionIntent, WalletAccount } from "../src/index.ts";

test("dispatch request remains decimal-string based", () => {
  const request: DispatchPreviewRequest = {
    assetId: "battery-a",
    targetPowerMw: "2.500",
    durationMinutes: 30,
    mode: "discharge",
    reason: "peak support",
  };
  assert.equal(typeof request.targetPowerMw, "string");
});

test("safe actions require idempotency and request identity", () => {
  const intent: SafeActionIntent = {
    id: "intent_1",
    type: "ems.dispatch",
    organizationId: "org_1",
    actorId: "user_1",
    payload: {},
    idempotencyKey: "idem_1",
    requestId: "req_1",
    createdAt: new Date(0).toISOString(),
  };
  assert.equal(intent.idempotencyKey, "idem_1");
  assert.equal(intent.requestId, "req_1");
});

test("wallet contract is chain-neutral", () => {
  const account: WalletAccount = {
    chain: "sui",
    address: "0xabc",
    capabilities: ["connect", "sign_message"],
  };
  assert.equal(account.chain, "sui");
});
