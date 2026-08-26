import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";

const require = createRequire(import.meta.url);

const expectedWalletUi = "4.3.0";
let failed = false;

async function readPackage(specifier) {
  const path = require.resolve(specifier);
  return JSON.parse(await readFile(path, "utf8"));
}

try {
  const expoBase = require.resolve("expo/tsconfig.base");
  console.log(`✓ expo/tsconfig.base: ${expoBase}`);
} catch {
  failed = true;
  console.error("✗ expo/tsconfig.base does not resolve");
}

try {
  const expo = await readPackage("expo/package.json");
  console.log(`✓ Expo ${expo.version}`);
} catch {
  failed = true;
  console.error("✗ Expo package unavailable");
}

try {
  const walletUi = await readPackage(
    "@wallet-ui/react-native-web3js/package.json",
  );

  if (walletUi.version !== expectedWalletUi) {
    failed = true;
    console.error(
      `✗ @wallet-ui/react-native-web3js ${walletUi.version}; expected ${expectedWalletUi}`,
    );
  } else {
    console.log(
      `✓ @wallet-ui/react-native-web3js ${walletUi.version}`,
    );
  }
} catch {
  failed = true;
  console.error(
    "✗ @wallet-ui/react-native-web3js is unavailable",
  );
}

if (failed) {
  console.error(`
Repair the workspace with:

  pnpm install
  pnpm --dir apps/mobile exec expo install --fix
`);
  process.exit(1);
}
