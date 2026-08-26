# Frontend TypeScript configuration

PowerChain uses two TypeScript entry points for different lifecycle stages.

## Editor / bootstrap

`apps/mobile/tsconfig.json`:

```json
{ "extends": "./expo/tsconfig.base.json" }
```

This checked-in PowerChain bootstrap prevents VS Code from reporting a missing
`expo/tsconfig.base` before dependencies are installed. It contains only stable
React Native / bundler compiler defaults and no package-owned Expo internals.

## Installed Expo validation

`apps/mobile/tsconfig.expo.json`:

```json
{ "extends": "expo/tsconfig.base" }
```

After `pnpm install`, run:

```bash
cd apps/mobile
pnpm run verify:expo
pnpm run typecheck:expo
```

This ensures the application still conforms to the actual Expo package shipped
in `node_modules`.

## Runtime commands

```bash
pnpm install
cd apps/mobile
pnpm exec expo start
pnpm exec expo run:ios
pnpm exec expo run:android
```

The local bootstrap is an editor reliability layer. It does not replace Expo's
runtime package or the post-install compatibility check.
