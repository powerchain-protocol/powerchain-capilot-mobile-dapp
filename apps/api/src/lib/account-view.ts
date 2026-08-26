export function accountView(user: any) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
    onboardingStatus: user.onboardingStatus,
    profile: user.profile
      ? {
          displayName: user.displayName,
          organization: user.profile.organization,
          jobTitle: user.profile.jobTitle,
          country: user.profile.country,
          timezone: user.profile.timezone,
          interests: user.profile.interests,
          onboardingStep: user.profile.onboardingStep,
        }
      : null,
    wallets: (user.wallets ?? []).map((wallet: any) => ({
      id: wallet.id,
      address: wallet.address,
      network: wallet.network,
      label: wallet.label,
      isPrimary: wallet.isPrimary,
      verifiedAt: wallet.verifiedAt?.toISOString?.() ?? wallet.verifiedAt,
    })),
  };
}
