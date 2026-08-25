export type OnboardingStep =
  | "welcome"
  | "account"
  | "profile"
  | "wallet"
  | "integrations"
  | "complete";

export type OnboardingDraft = {
  displayName?: string;
  organization?: string;
  jobTitle?: string;
  country?: string;
  timezone?: string;
  interests: string[];
  walletAddress?: string;
  enableMarketData: boolean;
  enableAi: boolean;
};

export const onboardingOrder: OnboardingStep[] = [
  "welcome",
  "account",
  "profile",
  "wallet",
  "integrations",
  "complete",
];
