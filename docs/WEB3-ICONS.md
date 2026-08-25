PowerChain Copilot Mobile — Web3 Icons

• Install

```bash
pnpm add @web3icons/react
```

The implementation pins the dependency through `package.additions.json` as well.

• Supported assets

```text
PWRC — PowerChain / Solana Token-2022
SOL  — Solana native asset
USDC — USD Coin on Solana
EURC — EURC on Solana
SUI  — Sui native asset
```

• Supported networks

```text
Solana
Sui
```

• Wallet icons

The shared wallet registry includes:

```text
Phantom
Solflare
Backpack
Ledger
WalletConnect
Generic wallet
```

• Architecture

```text
src/types/web3-assets.ts
src/data/web3-assets.ts

src/components/web3/
├── AssetIcon.web.tsx
├── AssetIcon.native.tsx
├── NetworkIcon.web.tsx
├── NetworkIcon.native.tsx
├── WalletIcon.web.tsx
├── WalletIcon.native.tsx
├── AssetRow.tsx
├── AssetSelector.tsx
├── WalletButton.tsx
└── index.ts
```

• Expo Web

Expo Web uses:

```ts
import {
  TokenIcon,
  NetworkIcon,
  WalletIcon,
} from "@web3icons/react/dynamic";
```

Web3 Icons dynamic components are used so the registry can select an icon by token symbol, network ID, or wallet name.

• Expo native

`@web3icons/react` renders browser SVG elements and is therefore kept behind `.web.tsx` files.

iOS and Android use `.native.tsx` components with an offline-safe native fallback.

This prevents browser-only SVG DOM components from entering native bundles.

PWRC is rendered from the PowerChain-owned local token icon on all platforms.

• PWRC icon

Generated from the supplied PowerChain brand mark:

```text
assets/tokens/pwrc.png
assets/tokens/pwrc-128.png
assets/tokens/pwrc-256.png
assets/tokens/pwrc-512.png
```

Public web equivalents are available under:

```text
public/assets/tokens/
```

• Registry use

Do not hard-code token labels and icons in individual screens.

Use:

```ts
import {
  web3Assets,
  web3Networks,
  web3Wallets,
} from "@/data/web3-assets";
```

and:

```tsx
<AssetIcon symbol="PWRC" />
<AssetIcon symbol="SOL" />
<AssetIcon symbol="USDC" />
<AssetIcon symbol="EURC" />
<AssetIcon symbol="SUI" />

<NetworkIcon network="solana" />
<NetworkIcon network="sui" />

<WalletIcon wallet="phantom" />
<WalletIcon wallet="solflare" />
<WalletIcon wallet="backpack" />
```

• PWRC canonical configuration

The registry contains the canonical PWRC mainnet-beta mint:

```text
PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc
```

PWRC remains a Solana Token-2022 asset with 9 decimals.

• USDC

The registry includes the canonical Solana mainnet USDC mint.

• EURC

EURC is registered as an icon/display asset without a hard-coded mint in this package.

Network-specific mint configuration should come from the server-side token registry so production code does not silently use an incorrect deployment address.

• UI rules

Token icons:

```text
32–40px in asset rows
20–24px in compact transaction rows
40–48px in asset headers
```

Wallet icons:

```text
28–32px in connection buttons
20–24px in compact account rows
```

Do not stretch Web3 logos.

Keep icons square and preserve their official aspect ratio.
