import { access, readFile } from "node:fs/promises";
const required = [
  "apps/mobile/package.json", "apps/mobile/tsconfig.json", "apps/mobile/tsconfig.expo.json",
  "apps/mobile/expo/tsconfig.base.json", "apps/mobile/expo-env.d.ts", "apps/mobile/index.js",
  "apps/mobile/polyfill.js", "apps/mobile/app.config.ts", "apps/mobile/app/_layout.tsx",
  "apps/mobile/app/index.tsx", "apps/mobile/src/providers/AppProviders.tsx",
  "apps/mobile/assets/icons/icon.png", "apps/mobile/scripts/preflight.mjs",
  "apps/mobile/scripts/verify-config.mjs", "apps/mobile/scripts/verify-expo.mjs",
  "apps/mobile/scripts/verify-bootstrap-tsconfig.mjs"
];
let failed = false;
for (const file of required) {
  try { await access(file); console.log(`✓ ${file}`); }
  catch { failed = true; console.error(`✗ ${file}`); }
}
const packageJson = JSON.parse(await readFile("apps/mobile/package.json", "utf8"));
const tsconfig = JSON.parse(await readFile("apps/mobile/tsconfig.json", "utf8"));
const expoTsconfig = JSON.parse(await readFile("apps/mobile/tsconfig.expo.json", "utf8"));
const checks = [
  ["frontend version 1.0.0", packageJson.version === "1.0.0"],
  ["frontend package manager pnpm 11.23.0", packageJson.packageManager === "pnpm@11.23.0"],
  ["Wallet UI 4.3.0", packageJson.dependencies?.["@wallet-ui/react-native-web3js"] === "4.3.0"],
  ["local Expo bootstrap config", tsconfig.extends === "./expo/tsconfig.base.json"],
  ["official Expo installed validation", expoTsconfig.extends === "expo/tsconfig.base"],
];
for (const [label, ok] of checks) { console.log(`${ok ? "✓" : "✗"} ${label}`); if (!ok) failed = true; }
if (failed) process.exit(1);
