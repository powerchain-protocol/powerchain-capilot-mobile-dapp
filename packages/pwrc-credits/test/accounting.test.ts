import assert from "node:assert/strict";
import test from "node:test";
import {
  EMPTY_PWRC_BALANCE,
  InsufficientPwrcCreditsDomainError,
  PWRC_DEMO_GRANT_BASE_UNITS,
  PWRC_MESSAGE_COST_BASE_UNITS,
  assertPwrcBalanceInvariant,
  fundPwrc,
  releaseCompletedResponseReservation,
  reserveCompletedResponse,
  settleCompletedResponse,
} from "../src/index.ts";

test("sample grant is exactly 1,000,000 PWRC in 9-decimal base units", () => {
  assert.equal(PWRC_DEMO_GRANT_BASE_UNITS, 1_000_000_000_000_000n);
});

test("one completed response is exactly 10,000 PWRC in base units", () => {
  assert.equal(PWRC_MESSAGE_COST_BASE_UNITS, 10_000_000_000_000n);
});

test("reserve then settle preserves funded balance conservation", () => {
  const funded = fundPwrc(EMPTY_PWRC_BALANCE, PWRC_DEMO_GRANT_BASE_UNITS);
  const reserved = reserveCompletedResponse(funded);
  assert.equal(reserved.availableBaseUnits, 990_000_000_000_000n);
  assert.equal(reserved.reservedBaseUnits, PWRC_MESSAGE_COST_BASE_UNITS);
  const settled = settleCompletedResponse(reserved);
  assert.equal(settled.reservedBaseUnits, 0n);
  assert.equal(settled.spentBaseUnits, PWRC_MESSAGE_COST_BASE_UNITS);
  assertPwrcBalanceInvariant(settled);
});

test("expiry/release restores reserved funds without spend", () => {
  const funded = fundPwrc(EMPTY_PWRC_BALANCE, PWRC_DEMO_GRANT_BASE_UNITS);
  const reserved = reserveCompletedResponse(funded);
  const released = releaseCompletedResponseReservation(reserved);
  assert.deepEqual(released, funded);
});

test("zero balance raises domain insufficient-credit error", () => {
  assert.throws(
    () => reserveCompletedResponse(EMPTY_PWRC_BALANCE),
    (error: unknown) =>
      error instanceof InsufficientPwrcCreditsDomainError &&
      error.code === "INSUFFICIENT_PWRC_CREDITS" &&
      error.details?.requiredBaseUnits === "10000000000000",
  );
});
