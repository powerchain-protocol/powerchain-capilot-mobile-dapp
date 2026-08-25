export type PwrcCreditErrorCode =
  | "INSUFFICIENT_PWRC_CREDITS"
  | "PWRC_AMOUNT_INVALID"
  | "PWRC_LEDGER_INVARIANT"
  | "PWRC_SETTLEMENT_IDEMPOTENCY_CONFLICT";

export class PwrcCreditDomainError extends Error {
  readonly code: PwrcCreditErrorCode;
  readonly details?: Record<string, string>;

  constructor(
    code: PwrcCreditErrorCode,
    message: string,
    details?: Record<string, string>,
  ) {
    super(message);
    this.name = "PwrcCreditDomainError";
    this.code = code;
    this.details = details;
  }
}

export class InsufficientPwrcCreditsDomainError extends PwrcCreditDomainError {
  constructor(input: {
    availableBaseUnits: bigint;
    requiredBaseUnits: bigint;
    responseRunway: bigint;
  }) {
    super(
      "INSUFFICIENT_PWRC_CREDITS",
      "Insufficient PWRC Copilot credits.",
      {
        availableBaseUnits: input.availableBaseUnits.toString(),
        requiredBaseUnits: input.requiredBaseUnits.toString(),
        responseRunway: input.responseRunway.toString(),
      },
    );
  }
}
