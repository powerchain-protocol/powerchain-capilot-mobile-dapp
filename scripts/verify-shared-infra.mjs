import { access, readFile } from "node:fs/promises";

const required = [
  "frontend/src/shared/index.ts",
  "frontend/src/shared/errors.ts",
  "frontend/src/shared/helpers.ts",
  "frontend/src/shared/tokens.ts",
  "frontend/src/shared/assets.ts",
  "frontend/src/storage/index.ts",
  "frontend/src/storage/secure-storage.ts",
  "frontend/src/storage/preferences-storage.ts",
  "frontend/src/storage/session-storage.ts",
  "frontend/src/store/index.ts",
  "frontend/src/store/create-store.ts",
  "frontend/src/store/session-store.ts",
  "frontend/src/store/preferences-store.ts",
  "frontend/src/utils/util.ts",
  "frontend/src/utils/errors.ts",
  "frontend/src/utils/helpers.ts",
  "frontend/src/utils/tokens.ts",
  "frontend/src/utils/assets.ts",
];

for (const file of required) {
  await access(file);
  console.log(`✓ ${file}`);
}

const client = await readFile("frontend/src/api/client.ts", "utf8");
if (client.includes('from "expo-secure-store"')) {
  throw new Error("API client still bypasses the shared storage layer.");
}
if (!client.includes("sessionStore") || !client.includes("AppError")) {
  throw new Error("API client is not using the shared session/error infrastructure.");
}

const tokens = await readFile("frontend/src/shared/tokens.ts", "utf8");
if (!tokens.includes("PWRC_MESSAGE_COST_BASE_UNITS") || !tokens.includes("PWRC_MINT") || !tokens.includes("@powerchain/pwrc-credits")) {
  throw new Error("Shared PWRC token identity/economics are not sourced from the canonical credit package.");
}

const assets = await readFile("frontend/src/shared/assets.ts", "utf8");
if (!assets.includes("mark-light-transparent.png") || !assets.includes("pwrc.png")) {
  throw new Error("Shared asset registry is incomplete.");
}

const logo = await readFile("frontend/src/components/brand/Logo.tsx", "utf8");
const assetIcon = await readFile("frontend/src/components/web3/AssetIcon.native.tsx", "utf8");
if (!logo.includes("APP_ASSETS") || !assetIcon.includes("APP_ASSETS.tokens.pwrc")) {
  throw new Error("Shared asset registry exists but is not wired into branded UI components.");
}

console.log("✓ shared/storage/store/utils architecture");
