import test from "node:test";
import assert from "node:assert/strict";
import { assertSafeArguments } from "../src/security.ts";
import { mcpFunctionName } from "../src/names.ts";
const limits = { maxTools: 20, maxToolCalls: 4, maxArgumentBytes: 1024, maxToolSchemaBytes: 4096, maxResultChars: 8000, timeoutMs: 5000 };
test("names are deterministic", () => assert.equal(mcpFunctionName("energy", "search/assets"), "mcp__energy__search_assets"));
test("credential-like argument keys are blocked", () => assert.throws(() => assertSafeArguments({ api_key: "secret" }, limits)));
test("bounded arguments are allowed", () => assert.doesNotThrow(() => assertSafeArguments({ assetId: "A-1" }, limits)));
test("oversized arguments are blocked", () => assert.throws(() => assertSafeArguments({ q: "x".repeat(5000) }, limits)));
