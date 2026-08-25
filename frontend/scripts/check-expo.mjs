import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const checks = [
  ["expo", "Expo"],
  ["expo/tsconfig.base", "Expo TypeScript base"],
  ["expo-router/package.json", "Expo Router"],
  ["react-native/package.json", "React Native"],
  ["react-native-web/package.json", "React Native Web"],
  ["react-dom/package.json", "React DOM"],
  ["@expo/metro-runtime/package.json", "Expo Metro Runtime"]
];

let failed = false;

for (const [specifier, label] of checks) {
  try {
    require.resolve(specifier);
    console.log(`✓ ${label}`);
  } catch {
    failed = true;
    console.error(`✗ ${label} is not installed`);
  }
}

if (failed) {
  console.error(`
PowerChain frontend dependencies are incomplete.

Run from the repository root:

  pnpm install

Then validate the installed Expo configuration:

  pnpm --dir frontend run verify:installed

The editor-facing frontend/tsconfig.json intentionally extends
./expo/tsconfig.base.json. The installed validation config
frontend/tsconfig.expo.json extends Expo's package-owned
expo/tsconfig.base.
`);
  process.exit(1);
}

console.log("✓ Expo frontend dependency preflight");
