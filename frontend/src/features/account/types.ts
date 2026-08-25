export type AccountRole = "USER" | "OPERATOR" | "ADMIN" | "SUPERADMIN";
export type AccountStatus = "ACTIVE" | "SUSPENDED" | "DELETED";
export type OnboardingStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";

export type AccountProfile = {
  displayName: string;
  organization?: string | null;
  jobTitle?: string | null;
  country?: string | null;
  timezone?: string | null;
  interests: string[];
  onboardingStep: number;
};

export type LinkedWallet = {
  id: string;
  address: string;
  network: "SOLANA";
  label?: string | null;
  isPrimary: boolean;
  verifiedAt?: string | null;
};

export type Account = {
  id: string;
  email: string;
  displayName: string;
  role: AccountRole;
  status: AccountStatus;
  onboardingStatus: OnboardingStatus;
  profile?: AccountProfile | null;
  wallets: LinkedWallet[];
};

export type AuthResult = {
  token: string;
  account: Account;
};
