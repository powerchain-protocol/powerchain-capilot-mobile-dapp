import { access, readFile } from "node:fs/promises";
const required = [
  "frontend/package.json", "frontend/tsconfig.json", "frontend/tsconfig.expo.json",
  "frontend/expo/tsconfig.base.json", "frontend/expo-env.d.ts", "frontend/index.js",
  "frontend/polyfill.js", "frontend/app.config.ts", "frontend/app/_layout.tsx",
  "frontend/app/index.tsx", "frontend/src/providers/AppProviders.tsx",
  "frontend/assets/icons/icon.png", "frontend/scripts/preflight.mjs",
  "frontend/scripts/verify-config.mjs", "frontend/scripts/verify-expo.mjs",
  "frontend/scripts/verify-bootstrap-tsconfig.mjs"
];
let failed = false;
for (const file of required) {
  try { await access(file); console.log(`✓ ${file}`); }
  catch { failed = true; console.error(`✗ ${file}`); }
}
const packageJson = JSON.parse(await readFile("frontend/package.json", "utf8"));
const tsconfig = JSON.parse(await readFile("frontend/tsconfig.json", "utf8"));
const expoTsconfig = JSON.parse(await readFile("frontend/tsconfig.expo.json", "utf8"));
const checks = [
  ["frontend version 1.0.0", packageJson.version === "1.0.0"],
  ["frontend package manager pnpm 11.23.0", packageJson.packageManager === "pnpm@11.23.0"],
  ["Wallet UI 4.3.0", packageJson.dependencies?.["@wallet-ui/react-native-web3js"] === "4.3.0"],
  ["local Expo bootstrap config", tsconfig.extends === "./expo/tsconfig.base.json"],
  ["official Expo installed validation", expoTsconfig.extends === "expo/tsconfig.base"],
];
for (const [label, ok] of checks) { console.log(`${ok ? "✓" : "✗"} ${label}`); if (!ok) failed = true; }
if (failed) process.exit(1);
