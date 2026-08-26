import { apiFetch } from "../../api/client";
import type { Account } from "../account";

export async function saveOnboardingProgress(input: {
  step: number;
  profile?: {
    organization?: string | null;
    jobTitle?: string | null;
    country?: string | null;
    timezone?: string | null;
    interests?: string[];
  };
}) {
  return apiFetch<Account>("/onboarding", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function completeOnboarding() {
  return apiFetch<Account>("/onboarding/complete", {
    method: "POST",
  });
}
