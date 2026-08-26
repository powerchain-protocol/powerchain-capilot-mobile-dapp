export class OperationsApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 400,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'OperationsApiError';
  }
}

export function asOperationsApiError(error: unknown) {
  if (error instanceof OperationsApiError) return error;
  if (error instanceof Error && /required|invalid|must|exceed|unsupported|cannot/i.test(error.message)) {
    return new OperationsApiError('INVALID_REQUEST', error.message, 400);
  }
  return new OperationsApiError('OPERATIONS_API_ERROR', 'Operations request failed.', 500);
}
