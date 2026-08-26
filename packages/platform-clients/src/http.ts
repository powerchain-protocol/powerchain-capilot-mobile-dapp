export interface JsonHttpOptions {
  baseUrl: string;
  fetcher?: typeof fetch;
  getAccessToken?: () => Promise<string | null>;
}

export class JsonHttpClient {
  private readonly fetcher: typeof fetch;
  constructor(private readonly options: JsonHttpOptions) {
    this.fetcher = options.fetcher ?? fetch;
  }

  async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await this.options.getAccessToken?.();
    const response = await this.fetcher(`${this.options.baseUrl}${path}`, {
      ...init,
      headers: {
        accept: "application/json",
        ...(init?.body ? { "content-type": "application/json" } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP_${response.status}:${path}`);
    }
    return (await response.json()) as T;
  }
}
