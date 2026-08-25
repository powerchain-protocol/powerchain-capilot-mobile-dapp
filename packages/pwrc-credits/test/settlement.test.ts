import assert from "node:assert/strict";
import test from "node:test";
import { assertSettlementReplayCompatible } from "../src/index.ts";

const settlement = {
  settlementId: "settled_1",
  reference: "ref_1",
  amountBaseUnits: "500000000000000",
  network: "mainnet-beta",
  mint: "PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc",
  recipient: "11111111111111111111111111111111",
  transactionSignature: "5".repeat(88),
};

test("duplicate verified settlement is idempotent when evidence is identical", () => {
  assert.doesNotThrow(() => assertSettlementReplayCompatible(settlement, { ...settlement }));
});

test("duplicate settlement with changed amount is rejected", () => {
  assert.throws(() =>
    assertSettlementReplayCompatible(settlement, {
      ...settlement,
      amountBaseUnits: "500000000000001",
    }),
  );
});


test("duplicate settlement with changed token transfer evidence is rejected", () => {
  const withEvidence = {
    ...settlement,
    grossTransferBaseUnits: settlement.amountBaseUnits,
    withheldTransferFeeBaseUnits: "100",
    recipientNetBaseUnits: "499999999999900",
  };
  assert.doesNotThrow(() =>
    assertSettlementReplayCompatible(withEvidence, { ...withEvidence }),
  );
  assert.throws(() =>
    assertSettlementReplayCompatible(withEvidence, {
      ...withEvidence,
      withheldTransferFeeBaseUnits: "101",
    }),
  );
});
