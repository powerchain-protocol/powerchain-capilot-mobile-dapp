import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import { COPILOT_RESPONSE_COST_BASE_UNITS, PWRC_DECIMALS } from '../server/credits/constants.ts';

test('authoritative billing constants remain 10,000 PWRC at 9 decimals', () => {
  assert.equal(PWRC_DECIMALS, 9);
  assert.equal(COPILOT_RESPONSE_COST_BASE_UNITS, 10_000_000_000_000n);
});

test('authoritative billing migration and requested domain structure exist', () => {
  const required = [
    'server/db/migrations/004_pwrc_authoritative_billing_lifecycle.sql',
    'server/credits/anchor-worker.ts',
    'components/renewables/RenewableAssetSummary.tsx',
    'components/energy/EnergyMetric.tsx',
    'components/devices/DeviceStatus.tsx',
    'components/metering/MeterReading.tsx',
    'components/exchanges/ExchangeQuoteCard.tsx',
    'components/services/ServiceReadiness.tsx',
    'components/payments/buy/BuyPwrcPanel.tsx',
    'components/oracles/OracleEvidence.tsx',
    'packages/components/ui/exchanges/ExchangeStatus.tsx',
    'packages/middlewares/sap/index.ts',
    'types/oracles.ts',
    'types/exchanges/index.ts',
    'data/oracles/index.ts',
    'data/exchanges/index.ts',
    'oracles.ts',
    'exchanges/index.ts',
  ];
  for (const path of required) assert.equal(existsSync(path), true, `missing ${path}`);
  assert.match(readFileSync('server/db/migrations/004_pwrc_authoritative_billing_lifecycle.sql', 'utf8'), /pwrc_receipt_anchor_outbox/);
});
