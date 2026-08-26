import assert from "node:assert/strict";
import test from "node:test";
import {
  MOBILE_API_CORRECTED_ALIAS,
  MOBILE_API_PREFIX,
  rewriteMobileApiUrl,
} from "../src/http/api-namespace.ts";

test("requested capilot-mobile routes rewrite to canonical API", () => {
  assert.equal(
    rewriteMobileApiUrl(`${MOBILE_API_PREFIX}/credits/account`),
    "/api/v1/credits/account",
  );
  assert.equal(
    rewriteMobileApiUrl(`${MOBILE_API_PREFIX}/cors/`),
    "/api/v1/cors",
  );
  assert.equal(
    rewriteMobileApiUrl(`${MOBILE_API_PREFIX}/system/solana`),
    "/api/v1/system/solana",
  );
});

test("corrected copilot-mobile alias rewrites too", () => {
  assert.equal(
    rewriteMobileApiUrl(`${MOBILE_API_CORRECTED_ALIAS}/ai/chat?x=1`),
    "/api/v1/ai/chat?x=1",
  );
});

test("internal routes are not mirrored into the mobile namespace", () => {
  const internal = `${MOBILE_API_PREFIX}/internal/payment-kernel/events`;
  assert.equal(rewriteMobileApiUrl(internal), internal);
});

test("unknown future roots fail closed", () => {
  const unknown = `${MOBILE_API_PREFIX}/admin/anything`;
  assert.equal(rewriteMobileApiUrl(unknown), unknown);
});

test("namespace root remains a real metadata route", () => {
  assert.equal(rewriteMobileApiUrl(`${MOBILE_API_PREFIX}/`), MOBILE_API_PREFIX);
});


test("operational read roots and prepared actions are mobile-safe", () => {
  assert.equal(rewriteMobileApiUrl(`${MOBILE_API_PREFIX}/sites`), "/api/v1/sites");
  assert.equal(rewriteMobileApiUrl(`${MOBILE_API_PREFIX}/twin?siteId=site-1`), "/api/v1/twin?siteId=site-1");
  assert.equal(rewriteMobileApiUrl(`${MOBILE_API_PREFIX}/alarms?siteId=site-1`), "/api/v1/alarms?siteId=site-1");
  assert.equal(rewriteMobileApiUrl(`${MOBILE_API_PREFIX}/actions/prepare`), "/api/v1/actions/prepare");
});
