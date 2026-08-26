import { config } from "../config.js";

export class ProviderError extends Error {
  constructor(
    public readonly provider: string,
    public readonly code: "TIMEOUT" | "HTTP" | "REDIRECT" | "RESPONSE_TOO_LARGE" | "INVALID_JSON" | "PROVIDER_ERROR",
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export async function fetchBoundedJson<T>(
  provider: string,
  url: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      redirect: "manual",
      signal: AbortSignal.timeout(config.PROVIDER_TIMEOUT_MS),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "provider request failed";
    const timeout = /timeout|aborted|abort/i.test(message);
    throw new ProviderError(provider, timeout ? "TIMEOUT" : "PROVIDER_ERROR", message);
  }
  if (response.status >= 300 && response.status < 400) {
    throw new ProviderError(provider, "REDIRECT", "Provider redirects are rejected.", response.status);
  }
  if (!response.ok) {
    throw new ProviderError(provider, "HTTP", `${provider} returned HTTP ${response.status}.`, response.status);
  }
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > config.PROVIDER_MAX_RESPONSE_BYTES) {
    throw new ProviderError(provider, "RESPONSE_TOO_LARGE", `${provider} response exceeded size limit.`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > config.PROVIDER_MAX_RESPONSE_BYTES) {
    throw new ProviderError(provider, "RESPONSE_TOO_LARGE", `${provider} response exceeded size limit.`);
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as T;
  } catch {
    throw new ProviderError(provider, "INVALID_JSON", `${provider} returned invalid JSON.`);
  }
}
