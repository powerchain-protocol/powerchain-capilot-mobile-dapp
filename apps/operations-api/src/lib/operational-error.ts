export class OperationalError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "OperationalError";
  }
}

export function operationalError(
  code: string,
  statusCode: number,
  message = code,
  details?: Record<string, unknown>,
) {
  return new OperationalError(code, statusCode, message, details);
}
