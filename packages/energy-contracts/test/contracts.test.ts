import test from "node:test";
import assert from "node:assert/strict";
import type {
  DispatchPreviewRequest,
  EnergyValue,
  SafeActionIntent,
  SourceMeta,
  WalletAccount,
} from "../src/index.ts";

test("EMS quantities remain decimal-string based and support frequency", () => {
  const request: DispatchPreviewRequest = {
    siteId: "site_1",
    assetId: "battery-a",
    targetPowerMw: "2.500",
    durationMinutes: 30,
    mode: "discharge",
    reason: "peak support",
  };
  const frequency: EnergyValue = { value: "49.998", unit: "Hz", availability: "available" };
  assert.equal(typeof request.targetPowerMw, "string");
  assert.equal(frequency.unit, "Hz");
});

test("safe actions require idempotency and canonical prepare-only type", () => {
  const intent: SafeActionIntent = {
    id: "intent_1",
    type: "ems.dispatch.prepare",
    organizationId: "org_1",
    actorId: "user_1",
    siteId: "site_1",
    payload: {},
    idempotencyKey: "idem_0001",
    requestId: "req_1",
    createdAt: new Date(0).toISOString(),
  };
  assert.equal(intent.idempotencyKey, "idem_0001");
  assert.equal(intent.type, "ems.dispatch.prepare");
});

test("source metadata distinguishes observed, received and freshness", () => {
  const source: SourceMeta = {
    source: "meter.gateway",
    observedAt: new Date(0).toISOString(),
    receivedAt: new Date(1000).toISOString(),
    quality: "good",
    freshness: {
      state: "fresh",
      ageSeconds: 1,
      freshForSeconds: 30,
      staleAfterSeconds: 120,
    },
  };
  assert.notEqual(source.observedAt, source.receivedAt);
  assert.equal(source.freshness?.state, "fresh");
});

test("wallet contract is chain-neutral and contains public identity only", () => {
  const account: WalletAccount = {
    chain: "sui",
    address: "0xabc",
    capabilities: ["connect", "sign_message"],
  };
  assert.equal(account.chain, "sui");
  assert.equal("privateKey" in account, false);
});

test("missing telemetry is explicit and never synthesized as zero", () => {
  const missing: EnergyValue = { value: null, unit: "MW", availability: "unavailable" };
  assert.equal(missing.value, null);
  assert.equal(missing.availability, "unavailable");
});
