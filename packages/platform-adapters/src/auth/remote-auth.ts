import type {
  AuthAdapter,
  AuthSession,
  SignInInput,
} from "@powerchain/energy-contracts";

export interface RemoteAuthOptions {
  baseUrl: string;
  fetcher?: typeof fetch;
  getToken?: () => Promise<string | null>;
  setToken?: (token: string | null) => Promise<void>;
}

export class RemoteAuthAdapter implements AuthAdapter {
  readonly kind = "powerchain" as const;
  private readonly fetcher: typeof fetch;

  constructor(private readonly options: RemoteAuthOptions) {
    this.fetcher = options.fetcher ?? fetch;
  }

  async signIn(input: SignInInput): Promise<AuthSession> {
    const response = await this.fetcher(`${this.options.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      throw new Error(`AUTH_SIGN_IN_FAILED:${response.status}`);
    }
    const session = (await response.json()) as AuthSession;
    await this.options.setToken?.(session.accessToken);
    return session;
  }

  async signOut(): Promise<void> {
    const token = await this.options.getToken?.();
    await this.fetcher(`${this.options.baseUrl}/auth/logout`, {
      method: "POST",
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
    }).catch(() => undefined);
    await this.options.setToken?.(null);
  }

  async getSession(): Promise<AuthSession | null> {
    const token = await this.options.getToken?.();
    if (!token) return null;

    const response = await this.fetcher(`${this.options.baseUrl}/auth/session`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (response.status === 401) {
      await this.options.setToken?.(null);
      return null;
    }
    if (!response.ok) {
      throw new Error(`AUTH_SESSION_FAILED:${response.status}`);
    }
    return (await response.json()) as AuthSession;
  }
}
