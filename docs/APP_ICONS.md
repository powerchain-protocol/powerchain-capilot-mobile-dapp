# PowerChain Copilot app icons

Version: **1.0.0**

The launcher, splash, PWA, store and in-app brand assets are centralized under `assets/icon-pack/`. The supplied PowerChain artwork is used as the source; launcher variants are resize/composite derivatives and the emblem geometry is not redrawn.

## Expo

- `icon`: canonical 1024×1024 launcher icon.
- `ios.icon.light`, `ios.icon.dark`, `ios.icon.tinted`: appearance-specific 1024×1024 iOS masters.
- `android.adaptiveIcon`: foreground, white background image and Android 13+ monochrome source.
- `expo-notifications`: dedicated 96×96 all-white transparent Android notification glyph.
- `expo-splash-screen`: dark-green PowerChain mark with light/dark surface variants.

## Web / PWA

`public/icons/` and `apps/docs/public/icons/` contain favicon, Apple touch, PWA, maskable and Windows tile exports. `manifest.json` and `site.webmanifest` reference only local icon resources.

## Native and stores

`assets/icon-pack/ios/AppIcon.appiconset/` preserves iOS AppIcon exports. `assets/icon-pack/android/res/` contains Android launcher and notification densities. Store and desktop export masters are under `assets/icon-pack/store/` and `assets/icon-pack/desktop/`.

Run `pnpm verify:icons` after any branding change.
