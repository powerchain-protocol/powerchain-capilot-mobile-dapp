import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import process from "node:process";

const require = createRequire(import.meta.url);

let failed = false;

const [major, minor] = process.versions.node
  .split(".")
  .map(Number);

if (
  major < 22 ||
  (major === 22 && minor < 13) ||
  major >= 25
) {
  failed = true;
  console.error(
    `✗ Node ${process.versions.node} is outside supported range >=22.13 <25`,
  );
} else {
  console.log(`✓ Node ${process.versions.node}`);
}

for (const directory of ["app", "src", "assets"]) {
  if (!existsSync(directory)) {
    failed = true;
    console.error(`✗ Missing frontend/${directory}`);
  } else {
    console.log(`✓ frontend/${directory}`);
  }
}

const required = [
  ["expo/package.json", "Expo"],
  ["expo/tsconfig.base", "expo/tsconfig.base"],
  ["expo-router/package.json", "Expo Router"],
  ["react-native/package.json", "React Native"],
  ["react-native-web/package.json", "React Native Web"],
  ["react-dom/package.json", "React DOM"],
  ["@expo/metro-runtime/package.json", "Expo Metro Runtime"],
  [
    "@wallet-ui/react-native-web3js/package.json",
    "Wallet UI React Native Web3.js",
  ],
];

for (const [specifier, label] of required) {
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
PowerChain frontend runtime dependencies are incomplete. The checked-in TypeScript bootstrap remains available to the editor.

Run from the workspace root:

  pnpm install

Then from frontend, or from the root with --dir:

  pnpm exec expo start
  pnpm exec expo run:ios
  pnpm exec expo run:android

If Expo package versions need alignment:

  pnpm exec expo install --fix
  pnpm exec expo-doctor
`);
  process.exit(1);
}

console.log("✓ PowerChain frontend preflight");
