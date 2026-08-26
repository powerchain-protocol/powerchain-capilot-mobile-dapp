import { access, readFile } from "node:fs/promises";

const required = [
  "apps/mobile/src/shared/index.ts",
  "apps/mobile/src/shared/errors.ts",
  "apps/mobile/src/shared/helpers.ts",
  "apps/mobile/src/shared/tokens.ts",
  "apps/mobile/src/shared/assets.ts",
  "apps/mobile/src/storage/index.ts",
  "apps/mobile/src/storage/secure-storage.ts",
  "apps/mobile/src/storage/preferences-storage.ts",
  "apps/mobile/src/storage/session-storage.ts",
  "apps/mobile/src/store/index.ts",
  "apps/mobile/src/store/create-store.ts",
  "apps/mobile/src/store/session-store.ts",
  "apps/mobile/src/store/preferences-store.ts",
  "apps/mobile/src/utils/util.ts",
  "apps/mobile/src/utils/errors.ts",
  "apps/mobile/src/utils/helpers.ts",
  "apps/mobile/src/utils/tokens.ts",
  "apps/mobile/src/utils/assets.ts",
];

for (const file of required) {
  await access(file);
  console.log(`✓ ${file}`);
}

const client = await readFile("apps/mobile/src/api/client.ts", "utf8");
if (client.includes('from "expo-secure-store"')) {
  throw new Error("API client still bypasses the shared storage layer.");
}
if (!client.includes("sessionStore") || !client.includes("AppError")) {
  throw new Error("API client is not using the shared session/error infrastructure.");
}

const tokens = await readFile("apps/mobile/src/shared/tokens.ts", "utf8");
if (!tokens.includes("PWRC_MESSAGE_COST_BASE_UNITS") || !tokens.includes("PWRC_MINT") || !tokens.includes("@powerchain/pwrc-credits")) {
  throw new Error("Shared PWRC token identity/economics are not sourced from the canonical credit package.");
}

const assets = await readFile("apps/mobile/src/shared/assets.ts", "utf8");
if (!assets.includes("mark-light-transparent.png") || !assets.includes("pwrc.png")) {
  throw new Error("Shared asset registry is incomplete.");
}

const logo = await readFile("apps/mobile/src/components/brand/Logo.tsx", "utf8");
const assetIcon = await readFile("apps/mobile/src/components/web3/AssetIcon.native.tsx", "utf8");
if (!logo.includes("APP_ASSETS") || !assetIcon.includes("APP_ASSETS.tokens.pwrc")) {
  throw new Error("Shared asset registry exists but is not wired into branded UI components.");
}

console.log("✓ shared/storage/store/utils architecture");
