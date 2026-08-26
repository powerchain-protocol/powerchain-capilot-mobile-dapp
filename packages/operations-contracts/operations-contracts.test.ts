import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertCursor,
  assertEmsIngestRecord,
  assertIngestEnvelope,
  assertSafeActionRequest,
  classifySafeAction,
  parsePageLimit,
} from './src/index.ts';

test('safe actions classify state-changing preparation as review required', () => {
  assert.equal(classifySafeAction('ems.dispatch.prepare'), 'review_required');
  assert.equal(classifySafeAction('alarm.acknowledge.prepare'), 'review_required');
  assert.equal(classifySafeAction('settlement.prepare'), 'wallet_signature_required');
  assert.equal(classifySafeAction('iot.device.refresh'), 'read_only');
});

test('safe action contract rejects weak idempotency keys and oversized reasons', () => {
  assert.throws(() => assertSafeActionRequest({ action: 'iot.device.refresh', resourceId: 'meter-1', reason: 'refresh', idempotencyKey: 'x' }));
  assert.throws(() => assertSafeActionRequest({ action: 'iot.device.refresh', resourceId: 'meter-1', reason: 'x'.repeat(501), idempotencyKey: 'refresh-12345678' }));
});

test('pagination limits and cursors fail closed', () => {
  assert.equal(parsePageLimit(undefined, 50, 200), 50);
  assert.equal(parsePageLimit('100', 50, 200), 100);
  assert.throws(() => parsePageLimit('0', 50, 200));
  assert.throws(() => parsePageLimit('201', 50, 200));
  assert.equal(assertCursor('abc-123'), 'abc-123');
  assert.throws(() => assertCursor('../cursor'));
});

test('ingest envelopes enforce idempotency and bounded batches', () => {
  assert.doesNotThrow(() => assertIngestEnvelope({ idempotencyKey: 'ems:site-1:12345678', records: [{ id: 1 }] }, 100));
  assert.throws(() => assertIngestEnvelope({ idempotencyKey: 'bad', records: [{ id: 1 }] }, 100));
  assert.throws(() => assertIngestEnvelope({ idempotencyKey: 'valid-key-1234', records: [] }, 100));
});

test('EMS ingest requires decimal strings and rejects future timestamps', () => {
  const base = {
    siteId: 'site-1', source: 'gateway', mode: 'live' as const, status: 'operational' as const,
    generationKw: '1250.500000', loadKw: '1000.000000', storagePowerKw: '-50.000000', gridExchangeKw: '-200.500000',
    batterySocPercent: '72.5000', frequencyHz: '50.0200', observedAt: new Date().toISOString(),
  };
  assert.doesNotThrow(() => assertEmsIngestRecord(base));
  assert.throws(() => assertEmsIngestRecord({ ...base, generationKw: 1250 as unknown as string }));
  assert.throws(() => assertEmsIngestRecord({ ...base, observedAt: new Date(Date.now() + 10 * 60_000).toISOString() }));
});
