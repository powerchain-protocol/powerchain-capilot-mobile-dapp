import { requireApiBaseUrl } from '@/config/env';

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details: unknown;

  constructor(message: string, status = 0, details: unknown = null, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const DEFAULT_TIMEOUT_MS = 30_000;

type JsonRequestInit = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  authToken?: string;
};

type ErrorPayload = {
  error?: {
    code?: unknown;
    message?: unknown;
    details?: unknown;
  };
};

function apiErrorFromPayload(status: number, payload: unknown) {
  const candidate = payload && typeof payload === 'object' ? (payload as ErrorPayload).error : undefined;
  const message = typeof candidate?.message === 'string' ? candidate.message : `API request failed with status ${status}.`;
  const code = typeof candidate?.code === 'string' ? candidate.code : undefined;
  return new ApiError(message, status, candidate?.details ?? payload, code);
}

export async function requestJson<T>(path: string, init: JsonRequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const baseUrl = requireApiBaseUrl();

  try {
    const normalizedPath = path.startsWith('/api/v1/') && baseUrl.endsWith('/api/v1') ? path.slice('/api/v1'.length) : path;
    const response = await fetch(`${baseUrl}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`, {
      ...init,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(init.authToken ? { Authorization: `Bearer ${init.authToken}` } : {}),
        ...init.headers,
      },
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') ?? '';
    const payload: unknown = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) throw apiErrorFromPayload(response.status, payload);
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('The request timed out. Check connectivity and try again.');
    }
    throw new ApiError(error instanceof Error ? error.message : 'The request failed.');
  } finally {
    clearTimeout(timeout);
  }
}
