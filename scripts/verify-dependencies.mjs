import {
  readFile,
} from "node:fs/promises";

const root = JSON.parse(
  await readFile("package.json", "utf8"),
);
const frontend = JSON.parse(
  await readFile("apps/mobile/package.json", "utf8"),
);

let failed = false;

const checks = [
  [
    "root pnpm version",
    root.packageManager === "pnpm@11.23.0",
  ],
  [
    "frontend pnpm version",
    frontend.packageManager === "pnpm@11.23.0",
  ],
  [
    "@wallet-ui/react-native-web3js is 4.3.0",
    frontend.dependencies?.[
      "@wallet-ui/react-native-web3js"
    ] === "4.3.0",
  ],
  [
    "Expo dependency exists",
    typeof frontend.dependencies?.expo === "string",
  ],
  [
    "Expo Router dependency exists",
    typeof frontend.dependencies?.["expo-router"] === "string",
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

const serialized = JSON.stringify(frontend);

if (
  serialized.includes(
    '"@wallet-ui/react-native-web3js":"^1.0.0"',
  )
) {
  failed = true;
  console.error(
    "✗ obsolete Wallet UI ^1.0.0 dependency detected",
  );
}

if (failed) process.exit(1);

console.log("✓ Dependency contract");
