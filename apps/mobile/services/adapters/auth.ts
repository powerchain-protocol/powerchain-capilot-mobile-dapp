export type ClientAuthSnapshot = {
  userId: string;
  accessToken: string;
  organizationId?: string | null;
};

export interface ClientAuthAdapter {
  getSnapshot(): Promise<ClientAuthSnapshot | null> | ClientAuthSnapshot | null;
  getAccessToken(): Promise<string | null> | string | null;
}

export function createStaticAuthAdapter(getSnapshot: () => ClientAuthSnapshot | null): ClientAuthAdapter {
  return {
    getSnapshot,
    getAccessToken() {
      return getSnapshot()?.accessToken ?? null;
    },
  };
}
