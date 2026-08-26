export type PwrcIdentity = {
  symbol: 'PWRC';
  name: string;
  network: 'mainnet-beta';
  networkLabel: string;
  standard: 'Token-2022';
  programId: string;
  mint: string;
  decimals: 9;
  explorerUrl: string;
};

export type CreditPricing = {
  priceVersion: string;
  unit: 'copilot.response';
  responseCostBaseUnits: string;
  responseCostPwrc: string;
  messageUnit: 'MSG UNIT';
  referenceEconomics: {
    source: 'configured-initial-reference';
    referencePriceUsdPerPwrc: string;
    responseReferenceValueUsd: string;
    liveMarketPrice: false;
    disclaimer: string;
  };
  fundingPresets: Array<{ pwrc: string; responses: string; referenceValueUsd: string }>;
  unmeteredReads: readonly ['pricing', 'account', 'ledger'];
  demoGrantBaseUnits: string;
  demoGrantPwrc: string;
  demoGrantResponses: string;
  demoGrantIsSample: true;
  accounting: { representation: 'integer-base-units'; decimals: 9 };
  topUpSettlementAuthority: 'payment-kernel';
  topUpCreditEvent: 'payment.settled';
  pwrc: PwrcIdentity;
};

export type CreditAccount = {
  userId: string;
  availableBaseUnits: string;
  reservedBaseUnits: string;
  spentBaseUnits: string;
  fundedBaseUnits: string;
  availablePwrc: string;
  reservedPwrc: string;
  spentPwrc: string;
  fundedPwrc: string;
  responseCreditsRemaining: string;
  version: string;
  updatedAt: string;
};

export type CreditLedgerEntryType =
  | 'demo_grant'
  | 'payment_credit'
  | 'reservation_created'
  | 'reservation_settled'
  | 'reservation_released'
  | 'reservation_expired'
  | 'settlement_refund'
  | 'settlement_reversal';

export type CreditLedgerEntry = {
  id: string;
  sequence: string;
  type: CreditLedgerEntryType;
  availableDeltaBaseUnits: string;
  reservedDeltaBaseUnits: string;
  spentDeltaBaseUnits: string;
  fundedDeltaBaseUnits: string;
  availableAfterBaseUnits: string;
  reservedAfterBaseUnits: string;
  spentAfterBaseUnits: string;
  fundedAfterBaseUnits: string;
  reservationId?: string;
  paymentId?: string;
  quoteHash?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type CreditQuote = {
  hash: string;
  priceVersion: string;
  product: 'copilot.response';
  quantity: number;
  unitCostBaseUnits: string;
  totalBaseUnits: string;
  totalPwrc: string;
  issuedAt: string;
  expiresAt: string;
};

export type SolanaPayTopUp = {
  id: string;
  requestedBaseUnits: string;
  requestedPwrc: string;
  recipient: string;
  reference: string;
  solanaPayUri: string;
  status: 'pending' | 'settled' | 'expired';
  createdAt: string;
  expiresAt: string;
  paymentId?: string;
  settledAt?: string;
};
