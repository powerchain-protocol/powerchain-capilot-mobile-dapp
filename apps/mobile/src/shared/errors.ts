export type AppErrorCode =
  | "UNKNOWN"
  | "NETWORK_ERROR"
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "INSUFFICIENT_PWRC_CREDITS"
  | "SERVICE_UNAVAILABLE"
  | "CONFIGURATION_ERROR";

export type AppErrorOptions = {
  code?: AppErrorCode;
  status?: number;
  details?: unknown;
  cause?: unknown;
  retryable?: boolean;
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status?: number;
  readonly details?: unknown;
  readonly retryable: boolean;
  override readonly cause?: unknown;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = "AppError";
    this.code = options.code ?? "UNKNOWN";
    this.status = options.status;
    this.details = options.details;
    this.retryable = options.retryable ?? false;
    this.cause = options.cause;
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

export function errorMessage(value: unknown, fallback = "Something went wrong.") {
  if (value instanceof Error && value.message.trim()) return value.message;
  if (typeof value === "string" && value.trim()) return value;
  return fallback;
}

export function mapHttpStatusToErrorCode(status: number): AppErrorCode {
  if (status === 401) return "AUTH_REQUIRED";
  if (status === 402) return "INSUFFICIENT_PWRC_CREDITS";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 422 || status === 400) return "VALIDATION_ERROR";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "SERVICE_UNAVAILABLE";
  return "UNKNOWN";
}
