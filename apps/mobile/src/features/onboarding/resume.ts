import type { Account } from "../account";

export function resolveOnboardingRoute(account: Account | null) {
  if (!account) {
    return "/(onboarding)/account" as const;
  }

  if (account.onboardingStatus === "COMPLETE") {
    return "/(app)/(tabs)" as const;
  }

  const step = account.profile?.onboardingStep ?? 0;

  if (step <= 1) return "/(onboarding)/account" as const;
  if (step === 2) return "/(onboarding)/profile" as const;
  if (step === 3) return "/(onboarding)/wallet" as const;
  if (step === 4) return "/(onboarding)/integrations" as const;
  if (step >= 5) return "/(onboarding)/complete" as const;

  return "/(onboarding)/welcome" as const;
}
