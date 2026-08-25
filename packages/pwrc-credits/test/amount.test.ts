import assert from "node:assert/strict";
import test from "node:test";
import { formatPwrcBaseUnits, parseBaseUnitString, toBaseUnitString } from "../src/index.ts";

test("API decimal strings round-trip without Number conversion", () => {
  const input = "18446000000000000000";
  const parsed = parseBaseUnitString(input);
  assert.equal(typeof parsed, "bigint");
  assert.equal(toBaseUnitString(parsed), input);
});

test("unsafe/non-canonical base-unit strings are rejected", () => {
  for (const value of ["1.5", "1e9", "+1", "01", "-1", "", " 1"])
    assert.throws(() => parseBaseUnitString(value));
});


test("PWRC display formatting preserves all 9 decimal places without Number", () => {
  assert.equal(formatPwrcBaseUnits(1_234_567_890n), "1.23456789");
  assert.equal(formatPwrcBaseUnits(10_000_000_000_001n), "10000.000000001");
});
