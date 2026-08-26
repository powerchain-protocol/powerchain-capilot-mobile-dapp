export class CreditError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: Record<string, unknown>;

  constructor(message: string, code: string, status: number, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'CreditError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class InsufficientPwrcCreditsError extends CreditError {
  constructor(availableBaseUnits: bigint, requiredBaseUnits: bigint) {
    super('Insufficient PWRC credits for this Copilot response.', 'INSUFFICIENT_PWRC_CREDITS', 402, {
      availableBaseUnits: availableBaseUnits.toString(),
      requiredBaseUnits: requiredBaseUnits.toString(),
    });
    this.name = 'InsufficientPwrcCreditsError';
  }
}

export class CreditConflictError extends CreditError {
  constructor(message: string, code = 'CREDIT_CONFLICT', details: Record<string, unknown> = {}) {
    super(message, code, 409, details);
    this.name = 'CreditConflictError';
  }
}

export class CreditNotFoundError extends CreditError {
  constructor(message: string, code = 'CREDIT_NOT_FOUND') {
    super(message, code, 404);
    this.name = 'CreditNotFoundError';
  }
}
