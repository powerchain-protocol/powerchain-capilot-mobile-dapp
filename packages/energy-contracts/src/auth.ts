export type AuthProviderKind = "powerchain" | "supabase" | "oidc" | "custom";

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  user: {
    id: string;
    email?: string;
    displayName?: string;
  };
  organizationId?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface AuthAdapter {
  kind: AuthProviderKind;
  signIn(input: SignInInput): Promise<AuthSession>;
  signOut(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  refresh?(): Promise<AuthSession | null>;
}
