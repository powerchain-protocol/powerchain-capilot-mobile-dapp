import assert from 'node:assert/strict';
import test from 'node:test';

import { PROMPT_LIBRARY } from '../../apps/mobile/constants/prompts.ts';
import { buildCreditsGrounding } from '../copilot/credits-grounding.ts';
import { createMeteredCopilotResponse } from '../copilot/metered-response.ts';
import {
  COPILOT_RESPONSE_COST_BASE_UNITS,
  COPILOT_RESPONSE_REFERENCE_VALUE_MICRO_USD,
  COPILOT_RESPONSE_REFERENCE_VALUE_USD,
  PWRC_REFERENCE_PRICE_MICRO_USD_PER_TOKEN,
  PWRC_REFERENCE_PRICE_USD,
  DEMO_GRANT_BASE_UNITS,
  PWRC_BASE_UNITS_PER_TOKEN,
  PWRC_DECIMALS,
  PWRC_IDENTITY,
} from './constants.ts';
import { InMemoryCreditStore } from './memory-store.ts';
import { PwrcCreditService } from './service.ts';
import { formatPwrcBaseUnits, formatUsdMicroUnits, formatUsdMicroUnitsFixed, pwrcToBaseUnits } from './units.ts';

const NOW = new Date('2026-08-26T08:00:00.000Z');
const ACTOR = { userId: 'u1', organizationId: 'org-1', accountId: 'acct-1' };

test('PWRC uses exact 9-decimal bigint base-unit accounting', () => {
  assert.equal(PWRC_DECIMALS, 9);
  assert.equal(PWRC_BASE_UNITS_PER_TOKEN, 1_000_000_000n);
  assert.equal(pwrcToBaseUnits(10_000n), 10_000_000_000_000n);
  assert.equal(COPILOT_RESPONSE_COST_BASE_UNITS, 10_000_000_000_000n);
  assert.equal(formatPwrcBaseUnits(COPILOT_RESPONSE_COST_BASE_UNITS), '10000');
});

test('sample grant is exactly 1,000,000 PWRC = 100 responses', () => {
  assert.equal(DEMO_GRANT_BASE_UNITS, 1_000_000_000_000_000n);
  assert.equal(DEMO_GRANT_BASE_UNITS / COPILOT_RESPONSE_COST_BASE_UNITS, 100n);
});

test('PWRC identity exposes canonical mint/network and Explorer access', () => {
  assert.equal(PWRC_IDENTITY.network, 'mainnet-beta');
  assert.equal(PWRC_IDENTITY.decimals, 9);
  assert.equal(PWRC_IDENTITY.mint, 'PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc');
  assert.match(PWRC_IDENTITY.explorerUrl, /explorer\.solana\.com/);
  assert.match(PWRC_IDENTITY.explorerUrl, new RegExp(PWRC_IDENTITY.mint));
});

test('Copilot grounding carries authoritative organization-scoped credit state and Payment Kernel policy', async () => {
  const credits = new PwrcCreditService(new InMemoryCreditStore());
  await credits.claimDemoGrant(ACTOR, NOW);
  const quote = await credits.issueQuote(ACTOR, 1, NOW, 'copilot:req-grounding');
  const account = await credits.getAccount(ACTOR, NOW);
  const grounding = buildCreditsGrounding(account, quote);
  assert.equal(grounding.authoritative, true);
  assert.equal(grounding.userId, 'u1');
  assert.equal(account.organizationId, 'org-1');
  assert.equal(account.accountId, 'acct-1');
  assert.equal(grounding.balances.availableBaseUnits, DEMO_GRANT_BASE_UNITS.toString());
  assert.equal(grounding.pricing.responseCostBaseUnits, COPILOT_RESPONSE_COST_BASE_UNITS.toString());
  assert.equal(grounding.policy.some((line) => line.includes('payment.settled')), true);
});



test('configured reference economics use exact integer micro-USD math and are not a live price', () => {
  assert.equal(PWRC_REFERENCE_PRICE_MICRO_USD_PER_TOKEN, 2n);
  assert.equal(PWRC_REFERENCE_PRICE_USD, '0.000002');
  assert.equal(COPILOT_RESPONSE_REFERENCE_VALUE_MICRO_USD, 20_000n);
  assert.equal(formatUsdMicroUnits(COPILOT_RESPONSE_REFERENCE_VALUE_MICRO_USD), '0.02');
  assert.equal(COPILOT_RESPONSE_REFERENCE_VALUE_USD, '0.02');
  assert.equal(500_000n * PWRC_REFERENCE_PRICE_MICRO_USD_PER_TOKEN, 1_000_000n);
  assert.equal(formatUsdMicroUnits(1_000_000n), '1');
  assert.equal(formatUsdMicroUnitsFixed(1_000_000n, 2), '1.00');
  assert.equal(formatUsdMicroUnitsFixed(20_000n, 2), '0.02');
});

test('completed metered response receives a pmsg accounting id and one MSG UNIT envelope', async () => {
  const credits = new PwrcCreditService(new InMemoryCreditStore());
  await credits.claimDemoGrant(ACTOR, NOW);
  const result = await createMeteredCopilotResponse({
    actor: ACTOR,
    message: 'status',
    idempotencyKey: 'copilot:req-pmsg-unit',
    credits,
    now: NOW,
    generate: async () => ({ text: 'Operational status is stable.' }),
  });
  assert.match(result.delivery.responseId, /^pmsg_[a-f0-9]{32}$/);
  assert.equal(result.messageUnit.id, result.delivery.responseId);
  assert.equal(result.messageUnit.unit, 'MSG UNIT');
  assert.equal(result.messageUnit.pwrcDebit, '10000');
  assert.equal(result.messageUnit.referencePriceUsdPerPwrc, '0.000002');
  assert.equal(result.messageUnit.referenceValueUsd, '0.02');
  assert.equal(result.messageUnit.referenceOnly, true);
  assert.equal(result.messageUnit.receiptId, result.credits.receipt?.receiptId);
});
test('Prompt Library includes dedicated PWRC balance/capacity/ledger/settlement/reservation/quote prompts', () => {
  const credits = PROMPT_LIBRARY.filter((prompt) => prompt.category === 'credits');
  assert.ok(credits.length >= 6);
  const text = credits.map((prompt) => `${prompt.title} ${prompt.prompt}`).join('\n').toLowerCase();
  for (const required of ['available', 'reserved', 'spent', 'funded', 'payment.settled', 'quote hash', 'base-unit']) {
    assert.equal(text.includes(required), true, `missing credits prompt concept: ${required}`);
  }
});
