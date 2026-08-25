import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPwrcMessageQuote,
  canonicalJson,
  isPwrcMessageQuoteSnapshot,
} from "../src/quote.ts";
import {
  PWRC_MINT,
  PWRC_NETWORK,
  PWRC_TOKEN_2022_PROGRAM,
} from "../src/constants.ts";

test("message quote is deterministic", () => {
  assert.deepEqual(buildPwrcMessageQuote(), buildPwrcMessageQuote());
});

test("canonical JSON is key-order independent", () => {
  assert.equal(
    canonicalJson({ z: 1, a: { y: 2, x: 3 } }),
    canonicalJson({ a: { x: 3, y: 2 }, z: 1 }),
  );
});

test("quote hash binds canonical token identity and billing trigger", () => {
  const quote = buildPwrcMessageQuote();
  assert.equal(quote.network, PWRC_NETWORK);
  assert.equal(quote.mint, PWRC_MINT);
  assert.equal(quote.tokenProgram, PWRC_TOKEN_2022_PROGRAM);
  assert.equal(quote.billingTrigger, "delivery_acknowledged");
  assert.equal(quote.quoteKind, "copilot.completed_response");
  assert.equal(quote.quoteSchemaVersion, "1.0.0");
  assert.match(quote.quoteHash, /^[a-f0-9]{64}$/);
  assert.equal(isPwrcMessageQuoteSnapshot(quote), true);
});

test("quote snapshot validator rejects a changed mint", () => {
  const quote = { ...buildPwrcMessageQuote(), mint: "different" };
  assert.equal(isPwrcMessageQuoteSnapshot(quote), false);
});
