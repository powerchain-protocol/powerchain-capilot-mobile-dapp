export type McpInvocationSummaryDto = {
  serverId: string;
  toolName: string;
  functionName: string;
  status: "completed" | "failed";
  latencyMs: number;
};

export type PwrcCreditAccountDto = {
  id: string;
  availableBaseUnits: string;
  reservedBaseUnits: string;
  spentBaseUnits: string;
  fundedBaseUnits: string;
  availablePwrc: string;
  reservedPwrc: string;
  spentPwrc: string;
  fundedPwrc: string;
  responseRunway: number;
  lowCredit: boolean;
  version: number;
  updatedAt: string;
};

export type PwrcMessageReceiptDto = {
  id: string;
  quoteSchemaVersion: "1.0.0";
  quoteKind: "copilot.completed_response";
  billingTrigger: "delivery_acknowledged";
  asset: "PWRC";
  network: "devnet" | "mainnet-beta";
  mint: string;
  tokenProgram: string;
  decimals: 9;
  messageUnit: 1;
  quoteHash: string;
  debitBaseUnits: string;
  debitPwrc: string;
  referenceUsd: string;
  referenceUsdMicros: string;
  referencePriceUsdPerPwrc: string;
  referencePriceIsLive: false;
  pricingVersion: string;
  mcpInvocations?: McpInvocationSummaryDto[];
  createdAt: string;
};

export type PwrcMessageQuoteDto = {
  quoteSchemaVersion: "1.0.0";
  quoteKind: "copilot.completed_response";
  billingTrigger: "delivery_acknowledged";
  pricingVersion: string;
  asset: "PWRC";
  network: "devnet" | "mainnet-beta";
  mint: string;
  tokenProgram: string;
  responseUnits: 1;
  costTokens: string;
  costBaseUnits: string;
  decimals: 9;
  referenceUsdPerPwrc: string;
  referenceUsd: string;
  referenceUsdMicrosPerPwrc: string;
  referenceUsdMicros: string;
  referencePriceIsLive: false;
  quoteHash: string;
};

export type PwrcPricingDto = {
  version: "1.0.0";
  pricingVersion: string;
  referencePrice: {
    usdPerPwrc: string;
    usdMicrosPerPwrc: string;
    isLiveMarketPrice: false;
    label: string;
  };
  completedResponse: {
    responseUnits: 1;
    pwrc: string;
    baseUnits: string;
    referenceUsd: string;
    referenceUsdMicros: string;
    quoteHash: string;
  };
  referenceEconomics: Array<{
    responses: number;
    pwrc: string;
    referenceUsd: string;
  }>;
  presets: Array<{
    responses: 50 | 250 | 500 | 1000;
    pwrc: string;
    baseUnits: string;
  }>;
  token: {
    symbol: "PWRC";
    decimals: 9;
    mint: string;
    tokenProgram: string;
    network: string;
    explorerUrl: string;
  };
  topupsEnabled: boolean;
  demoGrantEnabled: boolean;
  lowCreditResponseThreshold: number;
};

export type PwrcLedgerEntryDto = {
  id: string;
  entryType: "DEMO_GRANT" | "FUNDING" | "RESERVE" | "SETTLE" | "RELEASE" | "EXPIRE";
  deltaAvailableBaseUnits: string;
  deltaReservedBaseUnits: string;
  deltaSpentBaseUnits: string;
  deltaFundedBaseUnits: string;
  reservationId?: string | null;
  messageReceiptId?: string | null;
  paymentSettlementId?: string | null;
  description: string;
  metadata?: unknown;
  createdAt: string;
};

export type PwrcFundingDto = {
  id: string;
  paymentSettlementId: string;
  paymentReference?: string | null;
  transactionSignature: string | null;
  amountBaseUnits: string;
  amountPwrc: string;
  recipient: string;
  pricingVersion: string;
  messageQuoteHash: string;
  grossTransferBaseUnits?: string | null;
  withheldTransferFeeBaseUnits?: string | null;
  recipientNetBaseUnits?: string | null;
  network: string;
  mint: string;
  createdAt: string;
};

export type PwrcTopupIntentDto = {
  id: string;
  reference: string;
  idempotencyKey?: string | null;
  settlementId?: string | null;
  responses: 50 | 250 | 500 | 1000;
  amountPwrc: string;
  amountBaseUnits: string;
  pricingVersion: string;
  messageQuoteHash: string;
  network: string;
  mint: string;
  recipient: string;
  status: "PENDING" | "SETTLED" | "EXPIRED" | "CANCELLED";
  expiresAt: string;
  settledAt?: string | null;
  solanaPayUrl?: string | null;
  replay?: boolean;
};

export type PwrcCreditReconciliationDto = {
  status: "balanced" | "exception";
  checks: {
    availableMatchesLedger: boolean;
    reservedMatchesLedger: boolean;
    spentMatchesLedger: boolean;
    fundedMatchesLedger: boolean;
    activeReservationsMatchReserved: boolean;
    conservation: boolean;
    receiptsMatchSpent: boolean;
    settleLedgerMatchesReceipts: boolean;
    settledReservationsMatchReceipts: boolean;
    fundingRowsMatchFundingLedger: boolean;
  };
  account: PwrcCreditAccountDto;
  ledgerExpectedBaseUnits: {
    available: string;
    reserved: string;
    spent: string;
    funded: string;
  };
  activeReservations: number;
  activeReservationBaseUnits: string;
  receiptCount: number;
  receiptDebitBaseUnits: string;
  settledReservationCount: number;
  fundingCount: number;
  fundingBaseUnits: string;
  fundingLedgerBaseUnits: string;
  checkedAt: string;
};
