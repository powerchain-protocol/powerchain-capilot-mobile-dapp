import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), 'utf8');
const mustExist = [
  'server/credits/canonical-json.ts', 'server/credits/quote.ts', 'server/credits/service.ts',
  'server/credits/receipt.ts', 'server/credits/signing.ts', 'server/credits/anchor-worker.ts',
  'server/db/migrations/004_pwrc_authoritative_billing_lifecycle.sql', 'docs/PWRC_BILLING_LIFECYCLE.md',
  'tests/billing-lifecycle.test.ts', 'components/renewables/RenewableAssetSummary.tsx',
  'components/energy/EnergyMetric.tsx', 'components/devices/DeviceStatus.tsx',
  'components/metering/MeterReading.tsx', 'components/exchanges/ExchangeQuoteCard.tsx',
  'components/services/ServiceReadiness.tsx', 'components/payments/buy/BuyPwrcPanel.tsx',
  'components/oracles/OracleEvidence.tsx', 'packages/components/ui/exchanges/ExchangeStatus.tsx',
  'packages/middlewares/sap/index.ts', 'types/exchanges/index.ts', 'types/oracles.ts',
  'data/exchanges/index.ts', 'data/oracles/index.ts', 'exchanges/index.ts', 'oracles.ts',
];
for (const file of mustExist) if (!existsSync(join(root, file))) throw new Error(`Missing authoritative billing asset: ${file}`);

const constants = read('server/credits/constants.ts');
if (!/PWRC_DECIMALS\s*=\s*9/.test(constants)) throw new Error('PWRC decimals must remain 9.');
if (!/COPILOT_RESPONSE_COST_PWRC\s*=\s*10_000n/.test(constants) || !/PWRC_BASE_UNITS_PER_TOKEN\s*=\s*1_000_000_000n/.test(constants)) throw new Error('Canonical 10,000 PWRC / 9-decimal base-unit derivation missing.');

const service = read('server/credits/service.ts');
for (const marker of ['QUOTE_NOT_PERSISTED', 'RESPONSE_NOT_DURABLE', 'reservation_settled', 'enqueueReceiptAnchor', 'createTokenizedReceipt']) {
  if (!service.includes(marker)) throw new Error(`Missing fail-closed service marker: ${marker}`);
}
if (!service.includes('DIRECT_SETTLEMENT_DISABLED')) throw new Error('Direct settlement must remain disabled.');

const metered = read('server/copilot/metered-response.ts');
const order = ['issueQuote(', 'reserveQuote(', 'recordCompletedDelivery({', 'settleCompletedDelivery('].map((m) => metered.indexOf(m));
if (order.some((i) => i < 0) || !order.every((v, i) => i === 0 || order[i - 1] < v)) throw new Error('Metered billing lifecycle is not ordered persist → reserve → response → settle.');

const receipt = read('server/credits/receipt.ts');
for (const marker of ["version: '1'", "status: 'SETTLED'", 'previousReceiptHash', 'signReceiptHash']) {
  if (!receipt.includes(marker)) throw new Error(`Missing signed receipt invariant: ${marker}`);
}

const migration = read('server/db/migrations/004_pwrc_authoritative_billing_lifecycle.sql');
for (const marker of ['pwrc_signed_receipts', 'pwrc_receipt_anchor_outbox', 'settlement_refund', 'settlement_reversal', 'CREATE TRIGGER pwrc_signed_receipts_no_update']) {
  if (!migration.includes(marker)) throw new Error(`Missing database invariant: ${marker}`);
}

const pkgFiles = [
  'package.json', 'apps/mobile/package.json', 'apps/docs/package.json', 'backend/express/package.json',
  'backend/operations-api/package.json', 'packages/operations-contracts/package.json', 'packages/components/package.json',
  'packages/middlewares/package.json',
];
for (const file of pkgFiles) {
  const pkg = JSON.parse(read(file));
  if (pkg.version !== '1.0.0') throw new Error(`${file} must remain version 1.0.0.`);
}

console.log('Authoritative PWRC billing lifecycle verified.');
