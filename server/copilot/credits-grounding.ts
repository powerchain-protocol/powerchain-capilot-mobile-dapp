import {
  COPILOT_MESSAGE_UNIT,
  COPILOT_RESPONSE_COST_BASE_UNITS,
  COPILOT_RESPONSE_REFERENCE_VALUE_USD,
  PWRC_IDENTITY,
  PWRC_REFERENCE_PRICE_USD,
} from '../credits/constants.ts';
import { formatPwrcBaseUnits } from '../credits/units.ts';
import type { CreditAccount, CreditQuote } from '../credits/types.ts';

export function buildCreditsGrounding(account: CreditAccount, quote: CreditQuote) {
  const remaining = account.availableBaseUnits / COPILOT_RESPONSE_COST_BASE_UNITS;
  return {
    namespace: 'powerchain.pwrc_credits',
    authoritative: true,
    source: 'PWRC Credit Kernel',
    userId: account.userId,
    asset: {
      symbol: PWRC_IDENTITY.symbol,
      mint: PWRC_IDENTITY.mint,
      network: PWRC_IDENTITY.network,
      decimals: PWRC_IDENTITY.decimals,
    },
    balances: {
      availableBaseUnits: account.availableBaseUnits.toString(),
      availablePwrc: formatPwrcBaseUnits(account.availableBaseUnits),
      reservedBaseUnits: account.reservedBaseUnits.toString(),
      spentBaseUnits: account.spentBaseUnits.toString(),
      fundedBaseUnits: account.fundedBaseUnits.toString(),
    },
    pricing: {
      quoteHash: quote.hash,
      priceVersion: quote.priceVersion,
      responseCostBaseUnits: quote.unitCostBaseUnits.toString(),
      responseCostPwrc: formatPwrcBaseUnits(quote.unitCostBaseUnits),
      messageUnit: COPILOT_MESSAGE_UNIT,
      referencePriceUsdPerPwrc: PWRC_REFERENCE_PRICE_USD,
      referenceValueUsdPerResponse: COPILOT_RESPONSE_REFERENCE_VALUE_USD,
      referenceValueIsLiveMarketPrice: false,
      responsesRemainingBeforeThisRequest: remaining.toString(),
      quoteExpiresAt: quote.expiresAt.toISOString(),
    },
    policy: [
      'Treat these balances as accounting values from the Credit Kernel, not wallet balances.',
      'Never claim a Solana payment funded credits until Payment Kernel verification produced payment.settled.',
      'The configured $0.000002/PWRC value is a reference value only; never present it as a live market price.',
      'One settled response equals one MSG UNIT and 10,000 PWRC; provider fallback and approved MCP calls do not create extra message-unit charges.',
      'Do not infer live token price or wallet balance from credit balances.',
    ],
  } as const;
}
