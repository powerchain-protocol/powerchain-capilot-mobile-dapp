import assert from 'node:assert/strict';
import test from 'node:test';
import { OperationsGatewayClient } from '../operations/gateway.ts';
import { loadServerEnv } from '../config/env.ts';
import { authorizeSafeAction } from '../../backend/operations-api/src/adapters/action-access.ts';
import { OperationsApiError } from '../../backend/operations-api/src/errors.ts';
import type { OperationsAccessAdapter } from '../../backend/operations-api/src/adapters/access.ts';

function withFetch(mock: typeof fetch, run: () => Promise<void>) {
  const original = globalThis.fetch;
  globalThis.fetch = mock;
  return run().finally(() => { globalThis.fetch = original; });
}

test('operations configuration is fail-closed by default', () => {
  const env = loadServerEnv({ NODE_ENV: 'development' });
  assert.equal(env.operations.backendUrl, '');
  assert.equal(env.operations.dataMode, 'unavailable');
  assert.equal(env.operations.features.safeActions, true);
  assert.equal(env.operations.features.digitalTwin, true);
  assert.equal(env.operations.pageSizeMax, 200);
});

test('gateway does not leak internal bearer secret and forwards user identity', async () => {
  const secret = 's'.repeat(32);
  await withFetch(async (_input, init) => {
    const headers = new Headers(init?.headers);
    assert.equal(headers.get('authorization'), `Bearer ${secret}`);
    assert.equal(headers.get('x-powerchain-user-id'), 'user-1');
    return new Response(JSON.stringify({ devices: [], page: { limit: 50, hasMore: false, nextCursor: null } }), { status: 200, headers: { 'content-type': 'application/json' } });
  }, async () => {
    const client = new OperationsGatewayClient({ baseUrl: 'http://127.0.0.1:8092', bearerSecret: secret, timeoutMs: 1_000 });
    const result = await client.iotDevices({ userId: 'user-1' }, 'site-1');
    assert.deepEqual(result.devices, []);
  });
});

test('gateway forwards bounded cursor pagination', async () => {
  await withFetch(async (input) => {
    const url = new URL(String(input));
    assert.equal(url.searchParams.get('siteId'), 'site-1');
    assert.equal(url.searchParams.get('cursor'), 'device-009');
    assert.equal(url.searchParams.get('limit'), '25');
    return new Response(JSON.stringify({ devices: [], page: { limit: 25, hasMore: false, nextCursor: null } }), { status: 200, headers: { 'content-type': 'application/json' } });
  }, async () => {
    const client = new OperationsGatewayClient({ baseUrl: 'http://127.0.0.1:8092', bearerSecret: 's'.repeat(32), timeoutMs: 1_000 });
    await client.iotDevices({ userId: 'user-1' }, 'site-1', { cursor: 'device-009', limit: 25 });
  });
});

test('safe action forwarding preserves idempotency key', async () => {
  await withFetch(async (_input, init) => {
    const headers = new Headers(init?.headers);
    assert.equal(headers.get('idempotency-key'), 'dispatch:site-1:12345678');
    return new Response(JSON.stringify({ decision: { requestId: 'r1' } }), { status: 201, headers: { 'content-type': 'application/json' } });
  }, async () => {
    const client = new OperationsGatewayClient({ baseUrl: 'http://127.0.0.1:8092', bearerSecret: 's'.repeat(32), timeoutMs: 1_000 });
    const result = await client.prepareAction({ userId: 'user-1' }, {
      action: 'ems.dispatch.prepare',
      resourceId: 'site-1',
      reason: 'Operator requested dispatch review.',
      idempotencyKey: 'dispatch:site-1:12345678',
    });
    assert.equal(result.decision.requestId, 'r1');
  });
});

function accessAdapter(overrides: Partial<OperationsAccessAdapter> = {}): OperationsAccessAdapter {
  return {
    async canAccessSite() { return true; },
    async siteIdForIotDevice() { return 'site-1'; },
    async siteIdForDepinNode() { return 'site-1'; },
    async siteIdForAlarm() { return 'site-1'; },
    async canAccessWallet() { return true; },
    ...overrides,
  };
}

test('resource authorization prevents device refresh outside user site scope', async () => {
  await assert.rejects(
    () => authorizeSafeAction(accessAdapter({ async canAccessSite() { return false; } }), { userId: 'user-1', roles: [] }, { action: 'iot.device.refresh', resourceId: 'meter-1', reason: 'Refresh.', idempotencyKey: 'refresh:meter:12345678' }),
    (error: unknown) => {
      assert.equal(error instanceof OperationsApiError && error.code, 'RESOURCE_ACCESS_DENIED');
      return true;
    },
  );
});

test('wallet-signature preparation is scoped to a wallet owned by the authenticated user', async () => {
  await assert.rejects(
    () => authorizeSafeAction(accessAdapter({ async canAccessWallet() { return false; } }), { userId: 'user-1', roles: [] }, { action: 'wallet.signature.prepare', resourceId: 'wallet-2', reason: 'Prepare signature.', idempotencyKey: 'wallet:sign:12345678' }),
    (error: unknown) => {
      assert.equal(error instanceof OperationsApiError && error.code, 'RESOURCE_ACCESS_DENIED');
      return true;
    },
  );
});
