import { readFile, access } from "node:fs/promises";

const pkg = JSON.parse(
  await readFile("package.json", "utf8"),
);
const tsconfig = JSON.parse(
  await readFile("tsconfig.json", "utf8"),
);
const appConfig = await readFile(
  "app.config.ts",
  "utf8",
);

const requiredPaths = [
  "app/_layout.tsx",
  "app/index.tsx",
  "src/providers/AppProviders.tsx",
  "assets/icons/icon.png",
  "index.js",
  "polyfill.js",
];

let failed = false;

const checks = [
  ["version is 1.0.0", pkg.version === "1.0.0"],
  [
    "pnpm is canonical package manager",
    pkg.packageManager === "pnpm@11.23.0",
  ],
  [
    "Wallet UI is pinned to 4.3.0",
    pkg.dependencies?.["@wallet-ui/react-native-web3js"] ===
      "4.3.0",
  ],
  [
    "checked-in Expo bootstrap TypeScript base",
    tsconfig.extends === "./expo/tsconfig.base.json",
  ],
  [
    "Expo dependency declared",
    Boolean(pkg.dependencies?.expo),
  ],
  [
    "Expo Router dependency declared",
    Boolean(pkg.dependencies?.["expo-router"]),
  ],
  [
    "React Native Web declared",
    Boolean(pkg.dependencies?.["react-native-web"]),
  ],
  [
    "Expo Router plugin configured",
    appConfig.includes('"expo-router"'),
  ],
  [
    "Metro web configured",
    appConfig.includes('bundler: "metro"'),
  ],
  [
    "release remains 1.0.0",
    appConfig.includes('version: "1.0.0"'),
  ],
];

for (const [label, ok] of checks) {
  if (ok) {
    console.log(`✓ ${label}`);
  } else {
    failed = true;
    console.error(`✗ ${label}`);
  }
}

for (const path of requiredPaths) {
  try {
    await access(path);
    console.log(`✓ ${path}`);
  } catch {
    failed = true;
    console.error(`✗ missing ${path}`);
  }
}

if (failed) process.exit(1);
