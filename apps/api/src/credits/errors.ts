import { InsufficientPwrcCreditsDomainError } from "@powerchain/pwrc-credits";

export class InsufficientPwrcCreditsError extends InsufficientPwrcCreditsDomainError {
  readonly statusCode = 402;

  constructor(input: {
    availableBaseUnits: string;
    requiredBaseUnits: string;
    responseRunway: number;
  }) {
    super({
      availableBaseUnits: BigInt(input.availableBaseUnits),
      requiredBaseUnits: BigInt(input.requiredBaseUnits),
      responseRunway: BigInt(input.responseRunway),
    });
    this.name = "InsufficientPwrcCreditsError";
  }
}

export class PwrcCreditCancelledError extends Error {
  readonly statusCode = 499;
  readonly code = "COPILOT_GENERATION_CANCELLED";

  constructor() {
    super("Copilot generation was cancelled. PWRC credits were not charged.");
    this.name = "PwrcCreditCancelledError";
  }
}
