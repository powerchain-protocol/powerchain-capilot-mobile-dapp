# PowerChain Copilot Frontend

**Version 1.0.0**

Expo / React Native frontend.

Repository:

```text
https://github.com/powerchain-protocol/powerchain-capilot-mobile-app
```

## Install

Install the workspace from repository root:

```bash
pnpm install
```

Then enter the frontend:

```bash
cd powerchain-capilot-mobile-app/frontend
```

## Expo

Start Metro:

```bash
pnpm exec expo start
```

Run iOS:

```bash
pnpm exec expo run:ios
```

Run Android:

```bash
pnpm exec expo run:android
```

Run web:

```bash
pnpm exec expo start --web
```

Align Expo-managed dependency versions:

```bash
pnpm exec expo install --fix
```

Check Expo health:

```bash
pnpm exec expo-doctor
```

## TypeScript

The editor-facing frontend config extends the checked-in bootstrap:

```json
{
  "extends": "./expo/tsconfig.base.json"
}
```

After dependencies are installed, `tsconfig.expo.json` validates against the official `expo/tsconfig.base`.

The local bootstrap must resolve before `pnpm install`. After installation, verify the official Expo package base separately:

```bash
pnpm exec node -e "console.log(require.resolve('expo/tsconfig.base'))"
```

## Wallet UI

The React Native Web3.js adapter is pinned to:

```text
@wallet-ui/react-native-web3js 4.3.0
```

The app uses `MobileWalletProvider` with Web3.js `chain`, `endpoint`, and `identity` configuration.

## PWRC Copilot Credits

The frontend includes `/(app)/copilot-credits`, PWRC balance/runway state,
message-cost visibility, stop-generation behavior, funding presets and per-message
`pmsg_...` receipts.

Opening pricing or balance screens does not invoke `/ai/chat` and therefore does
not consume a 10,000-PWRC completed-response unit.
