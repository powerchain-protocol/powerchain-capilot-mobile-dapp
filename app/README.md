# Expo Application

PowerChain Copilot Mobile **1.0.0** uses Expo Router for native navigation.

## Route groups

```text
(onboarding)
(auth)        # recommended authenticated-entry boundary
(app)         # authenticated product surfaces
```

The included onboarding implementation contains:

```text
welcome
account
profile
wallet
integrations
complete
```

## Onboarding contract

Onboarding progress is persisted by the API. `resolveOnboardingRoute()` maps the current account state back to the correct route after app restart or session restore.

Wallet connection is optional during onboarding. Unsupported wallet platforms must show an explicit unavailable state and allow the user to continue.

## Provider boundary

Recommended root composition:

```text
Theme Provider
  ↓
Account Provider
  ↓
Solana Wallet Provider
  ↓
Expo Router
```

## Native validation

A web preview is not sufficient validation for the Expo application. Verify both native targets with development builds before release.

## Route boundary

The production app now uses three explicit route groups:

```text
(auth)
(onboarding)
(app)
```

`app/index.tsx` is the session/bootstrap boundary. It routes unauthenticated users to login, incomplete accounts to their persisted onboarding step, and completed accounts to the main tab workspace.

The main tab bar intentionally stays at five items:

```text
Home
Copilot
Assets
Systems
Settings
```

Secondary product areas should use stack routes rather than expanding the tab bar.
